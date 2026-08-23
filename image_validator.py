"""
image_validator.py

Lightweight, model-free sanity check that an uploaded image looks like a
retinal fundus photograph before we hand it to the DR classifier.

Why this exists:
    The DR model is a single-label classifier trained on fundus photos.
    If a user uploads a face, a landscape, an X-ray, or a screenshot,
    the model will happily return *some* class plus a Grad-CAM heatmap
    that highlights nonsense. That looks authoritative and is actively
    dangerous in a screening workflow.

What we check (two cheap, independent signals):

    1. Corner darkness / circular framing.
       Real fundus images are framed by a circular camera aperture, so
       the four ~10% corner crops are almost entirely black. If those
       regions are bright or noisy, the image is probably not
       circularly framed and is unlikely to be a fundus photo.

    2. HSV hue distribution.
       Fundus photos are dominated by red-orange-brown tones (vessels,
       optic disc, retinal pigment). We measure the fraction of pixels
       that fall in the red-orange-brown hue range with reasonable
       saturation. A very low fraction is a strong "not a fundus" signal.

Both checks must pass for the image to be accepted. If either fails we
return a single, user-readable rejection message; we do NOT try to be
clever about partial credit.

Tuning notes:
    - The thresholds were picked to be conservative against false
      positives (rejecting a real fundus) at the cost of letting some
      non-fundus images through. The DR model still runs after this and
      will give a low confidence in those cases.
    - These are heuristics, not a guarantee. They are deliberately simple
      so they run in milliseconds and don't require a GPU.
"""

from __future__ import annotations

from typing import Tuple

import cv2
import numpy as np
from PIL import Image


# --- Threshold constants --------------------------------------------------

# Fraction of each side cropped from each corner for the darkness check.
# 10% of width/height is small enough to stay outside the fundus circle
# in well-framed images and large enough to give a stable mean.
CORNER_FRACTION = 0.10

# A corner is considered "dark" if its mean grayscale brightness is at or
# below this value (0-255). Real fundus photos are typically 0-15 in the
# corners; non-fundus images with any content at all usually exceed 30.
CORNER_BRIGHTNESS_MAX = 25.0

# Maximum allowed standard deviation of brightness across the four corners.
# True black corners have ~0 std. Non-fundus images tend to have varied
# (i.e. non-zero) brightness across corners.
CORNER_BRIGHTNESS_STD_MAX = 8.0

# HSV hue ranges that capture red-orange-brown retinal tissue.
# OpenCV hue is 0-179 (half-degrees), so we map the prompt's
# "0-40 and 340-360 degrees" to 0-20 and 170-179.
FUNDUS_HUE_RANGES = [(0, 20), (170, 179)]

# Minimum saturation for a pixel to count as "reddish tissue".
# Desaturated pixels (gray/black/white) are excluded so a black-and-white
# photo can't pass this check.
FUNDUS_SATURATION_MIN = 25  # 0-255

# A fundus image should have at least this fraction of its pixels in the
# red-orange-brown hue band. Real fundus photos are well above 30%; pure
# non-retinal images typically fall under 10%.
FUNDUS_HUE_PIXEL_FRACTION_MIN = 0.15

REJECTION_MESSAGE = (
    "Image does not appear to be a valid fundus photograph — "
    "please upload a retinal image"
)


def _crop_corner(gray: np.ndarray, top: int, left: int,
                 corner_h: int, corner_w: int) -> np.ndarray:
    """Slice out a rectangular corner region from a grayscale array.

    Args:
        gray: 2D uint8 array, the full image in grayscale.
        top: Starting row (0 for top corners, image_h - corner_h for bottom).
        left: Starting column (0 for left corners, image_w - corner_w for right).
        corner_h, corner_w: Height and width of the corner crop in pixels.

    Returns:
        A contiguous 2D array of shape (corner_h, corner_w).
    """
    return gray[top:top + corner_h, left:left + corner_w]


def _check_corner_darkness(rgb: np.ndarray) -> Tuple[bool, str]:
    """Reject images whose corners aren't predominantly dark/black.

    Real fundus photos are framed by a circular camera aperture, so the
    four ~10% corner crops should be near-black and roughly uniform.
    Anything else is a strong "not a fundus photo" signal.

    Args:
        rgb: HxWx3 uint8 array (RGB order).

    Returns:
        (ok, reason). `ok` is True when the corner test passes; `reason`
        is empty on success, otherwise a short human-readable explanation.
    """
    h, w = rgb.shape[:2]

    # Image is too small for a meaningful 10% corner crop; skip the check
    # rather than fail it. A 1x1 image has nothing to inspect anyway.
    if h < 20 or w < 20:
        return True, ""

    corner_h = max(1, int(h * CORNER_FRACTION))
    corner_w = max(1, int(w * CORNER_FRACTION))

    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)

    corners = [
        _crop_corner(gray, 0, 0, corner_h, corner_w),                       # top-left
        _crop_corner(gray, 0, w - corner_w, corner_h, corner_w),           # top-right
        _crop_corner(gray, h - corner_h, 0, corner_h, corner_w),           # bottom-left
        _crop_corner(gray, h - corner_h, w - corner_w, corner_h, corner_w),  # bottom-right
    ]

    means = np.array([float(c.mean()) for c in corners], dtype=np.float64)
    overall_mean = float(means.mean())
    overall_std = float(means.std())

    if overall_mean > CORNER_BRIGHTNESS_MAX:
        return False, (
            f"image corners are too bright (mean={overall_mean:.1f}); "
            f"expected a circular-framed retinal photo with dark corners"
        )

    if overall_std > CORNER_BRIGHTNESS_STD_MAX:
        return False, (
            f"image corners are not uniformly dark (std={overall_std:.1f}); "
            f"expected a circular-framed retinal photo"
        )

    return True, ""


def _check_hue_distribution(rgb: np.ndarray) -> Tuple[bool, str]:
    """Reject images whose color distribution isn't reddish/brownish.

    Fundus photos are dominated by red-orange-brown tissue (vessels,
    optic disc, retinal pigment). A photo with very few pixels in that
    hue band — for example a portrait, a landscape, an X-ray — is
    unlikely to be a fundus image.

    Args:
        rgb: HxWx3 uint8 array (RGB order).

    Returns:
        (ok, reason). `ok` is True when the hue test passes; `reason`
        is empty on success, otherwise a short human-readable explanation.
    """
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    hue = hsv[:, :, 0]
    saturation = hsv[:, :, 1]

    # Build a boolean mask: pixel is in any of the red-orange-brown hue
    # bands AND has enough saturation to actually carry color.
    in_fundus_hue = np.zeros_like(hue, dtype=bool)
    for low, high in FUNDUS_HUE_RANGES:
        # OpenCV hue wraps around 180, so we handle the band as two
        # contiguous ranges when it crosses the 0 boundary. Our ranges
        # are (0,20) and (170,179) — neither crosses 180, so a direct
        # comparison works for both.
        in_fundus_hue |= (hue >= low) & (hue <= high)

    colored_fundus_pixels = in_fundus_hue & (saturation >= FUNDUS_SATURATION_MIN)

    total_pixels = hue.size
    fundus_pixel_count = int(colored_fundus_pixels.sum())
    fundus_fraction = fundus_pixel_count / total_pixels if total_pixels else 0.0

    if fundus_fraction < FUNDUS_HUE_PIXEL_FRACTION_MIN:
        return False, (
            f"color distribution does not match a fundus photograph "
            f"({fundus_fraction * 100:.1f}% reddish-brown pixels; "
            f"expected at least "
            f"{FUNDUS_HUE_PIXEL_FRACTION_MIN * 100:.0f}%)"
        )

    return True, ""


def is_likely_fundus_image(image: Image.Image) -> Tuple[bool, str]:
    """Decide whether ``image`` looks like a retinal fundus photograph.

    Runs two cheap heuristics (corner darkness + HSV hue distribution).
    Both must pass. On rejection returns ``(False, REJECTION_MESSAGE)``;
    the underlying diagnostic detail is logged by the caller via the
    per-check reason, but the public message stays user-facing.

    Args:
        image: A PIL.Image. Must be decodable as RGB; alpha channels are
            flattened. The image is NOT resized here — the corner check
            needs real pixel resolution to be meaningful.

    Returns:
        A ``(ok, reason)`` tuple.
        - ``ok`` is True when the image passes both checks.
        - ``reason`` is an empty string on success, otherwise a single
          user-readable sentence explaining why the image was rejected.

    Notes:
        This is a heuristic, not a model. It errs on the side of
        accepting rather than rejecting: false positives (a non-fundus
        image that slips through) are caught downstream by the DR model
        returning low confidence, while false negatives (rejecting a
        real fundus) would block legitimate screenings.
    """
    if image is None:
        return False, REJECTION_MESSAGE

    # Flatten any alpha channel so we always have 3 channels for OpenCV.
    rgb = np.array(image.convert("RGB"))

    corner_ok, corner_reason = _check_corner_darkness(rgb)
    if not corner_ok:
        # We return the generic, user-facing message rather than the
        # technical reason; the caller can log the detail if needed.
        return False, REJECTION_MESSAGE

    hue_ok, hue_reason = _check_hue_distribution(rgb)
    if not hue_ok:
        return False, REJECTION_MESSAGE

    return True, ""
