import requests
import statistics

url = "http://127.0.0.1:8000/predict"
image_path = "fundus_img.png"

times = []

for i in range(10):
    with open(image_path, "rb") as f:

        response = requests.post(
            url,
            files={"file": ("fundus_img.png", f, "image/png")}
        )

    if response.status_code != 200:
        print(f"Request {i + 1}: ERROR {response.status_code}")
        print(response.text)
        continue

    data = response.json()

    api_time = data["processing_time_ms"]

    print(f"Request {i + 1}: {api_time:.2f} ms")

    times.append(api_time)


print("\n-------------------------")

if times:
    average = statistics.mean(times)

    print(f"Successful requests: {len(times)}")
    print(f"Average: {average:.2f} ms")
    print(f"Minimum: {min(times):.2f} ms")
    print(f"Maximum: {max(times):.2f} ms")

    throughput = 1000 / average

    print(f"Approx. throughput: {throughput:.2f} images/sec")
    print(f"Approx. throughput: {throughput * 3600:.0f} images/hour")