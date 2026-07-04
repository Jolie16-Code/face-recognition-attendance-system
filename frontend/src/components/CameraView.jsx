import {useRef,useEffect} from 'react'
import '../App.css'
import { BASE_URL } from '../config';
import * as faceapi from 'face-api.js'


function CameraView(){
  const videoRef = useRef()
  const canvasRef = useRef()

  // LOAD FROM USEEFFECT
  useEffect(()=>{
    startVideo()
    videoRef && loadModels()

    const timeoutId = setTimeout(() => {
      captureImage();
    }, 2000); // 2 seconds delay to capture the image
   
    return () => clearTimeout(timeoutId);

  },[])



  // OPEN YOU FACE WEBCAM
  const startVideo = ()=>{
    navigator.mediaDevices.getUserMedia({video:true})
    .then((currentStream)=>{
      videoRef.current.srcObject = currentStream
    })
    .catch((err)=>{
      console.log(err)
    })
  }
  // LOAD MODELS FROM FACE API

  const loadModels = ()=>{
    Promise.all([
      // THIS FOR FACE DETECT AND LOAD FROM YOU PUBLIC/MODELS DIRECTORY
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/models"),
      faceapi.nets.ageGenderNet.loadFromUri("/models"),

      ]).then(()=>{
      faceMyDetect()
    })
  }

  const faceMyDetect = ()=>{
    setInterval(async()=>{
      const detections = await faceapi.detectAllFaces(videoRef.current,
        new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions().withFaceDescriptors().withAgeAndGender();
       console.log(detections)
      // DRAW YOU FACE IN WEBCAM
      canvasRef.current.innerHtml = faceapi.createCanvasFromMedia(videoRef.current)
     
      faceapi.matchDimensions(canvasRef.current,{
        width:950,
        height:650
      })

      const resized = faceapi.resizeResults(detections,{
         width:950,
        height:650
      })

      faceapi.draw.drawDetections(canvasRef.current,resized)
      faceapi.draw.drawFaceLandmarks(canvasRef.current,resized)
      faceapi.draw.drawFaceExpressions(canvasRef.current,resized)

       // ask AI to guess age and gender with confidence level
       resized.forEach(face=>{
        const { age, gender, genderProbability, detect, descriptor } = face
        const genderText = `${gender} - ${Math.round(genderProbability*100)/100*100}`
        const ageText = `${Math.round(age)} years`
        const textField = new faceapi.draw.DrawTextField([genderText,ageText],face.detection.box.topRight)
        textField.draw(canvasRef.current)

        let label = faceMatcher.findBestMatch(descriptor).toString()
        // console.log(label)
        let options = {label: "Jordan"}
        if(label.includes("unknown")){
            options = {label: "Unknown subject..."}
        }
        const drawBox = new faceapi.draw.DrawBox(detect.box, options)
        drawBox.draw(canvasRef.current)
    })
      
      
          

    },200)
  }

 const captureImage = () => {
    const context = canvasRef.current.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    const dataURL = canvasRef.current.toDataURL('userImage/png');

    // Send the image to the backend for comparison
    axios.post(`${BASE_URL}/facelogin`, { image: dataURL })
      .then(response => {
        if (response.data.success) {
          setMessage("You are a registered member. We are redirecting you to your profile, hold on...");
          // Redirect to the profile page after a short delay
          setTimeout(() => {
            //window.location.href = `/profile?name=${encodeURIComponent(response.data.name)}&email=${encodeURIComponent(response.data.email)}&phone_number=${encodeURIComponent(response.data.phone_number)}&designation=${encodeURIComponent(response.data.designation)}&photo=${encodeURIComponent(response.data.photo)}`;
            navigate('/profile');
          }, 3000); // 3 seconds delay
        } else {
          setMessage("Please register your profile.");
        }
      })
      .catch(error => {
        console.error("There was an error!", error);
        setMessage("An error occurred while checking your profile.");
      });
  };



  return (
    <div className="myapp">
    <h1 className='heading'>FACADE 🎦</h1>
      <div className="appvide">
        
      <button className='bttn' ><video crossOrigin="anonymous" ref={videoRef} autoPlay></video></button>
      </div>
      <canvas ref={canvasRef} width="700" height="500"
      className="appcanvas"/>
      
    </div>
    )

}

export default CameraView;
