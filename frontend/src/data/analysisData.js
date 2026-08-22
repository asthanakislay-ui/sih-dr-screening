import originalImage from '../assets/mock-fundus-original.svg'
import gradCamImage from '../assets/mock-fundus-gradcam.svg'
import lesionMapImage from '../assets/mock-fundus-lesion-map.svg'

export const mockAnalysisData = {
  caseId: 'DR-1024',
  patient: {
    id: 'DR-1024',
    name: 'Rahul Kumar',
    age: 52,
    gender: 'Male',
  },
  screeningDate: '22 Aug 2026',
  diagnosis: {
    grade: 'Moderate NPDR',
    label: 'Referable DR',
    referable: true,
    confidence: '93%',
  },
  evidence: {
    microaneurysms: 'Detected',
    hemorrhages: 'Detected',
    exudates: 'Not detected',
    neovascularization: 'Not detected',
  },
  explainability: {
    originalImage,
    gradCamImage,
    lesionMapImage,
  },
  recommendation: {
    title: 'Refer to ophthalmologist',
    text: 'Referable diabetic retinopathy was detected. Clinical evaluation is recommended.',
  },
}
