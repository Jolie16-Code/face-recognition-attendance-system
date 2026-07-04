import {useRef,useEffect, useState} from 'react'
import '../App.css'
import { Link } from 'react-router-dom';
import * as faceapi from 'face-api.js'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Register from './Register';
import { BASE_URL } from '../config';

function Home(){
  const videoRef = useRef()
  const canvasRef = useRef()
  const detections = useRef()
  const navigate = useNavigate()
  const [message, setMessage] = useState('');
  const [capturedImages, setCapturedImages] = useState([]);
  const [matchResult, setMatchResult] = useState("");
  const [mood, setMood] = useState('');
  const [showForm, setShowForm] = useState(false); 
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  
 // const blinkDetected = useRef(false); 
  // LOAD FROM USEEFFECT
  useEffect(()=>{
    startVideo()
    videoRef && loadModels()
    /*const timeoutId = setTimeout(() => {
      captureImage();
    }, 2000); // 2 seconds delay to capture the image
   
    return () => clearTimeout(timeoutId);*/

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

       
        /*const faceMatcher = new faceapi.FaceMatcher(descriptor, 0.6);


        let label = faceMatcher.findBestMatch(descriptor).toString()
        // console.log(label)
        let options = {label: "Jordan"}
        if(label.includes("unknown")){
            options = {label: "Unknown subject..."}
        }*/
           
        const drawBox = new faceapi.draw.DrawBox(face.detection.box)
        drawBox.draw(canvasRef.current)


        /*const landmarks = face.detection.landmarks;

    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    // Helper to calculate EAR (eye aspect ratio)
    const calculateEAR = (eye) => {
      const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
      const vertical1 = dist(eye[1], eye[5]);
      const vertical2 = dist(eye[2], eye[4]);
      const horizontal = dist(eye[0], eye[3]);
      return (vertical1 + vertical2) / (2.0 * horizontal);
    };

    const leftEAR = calculateEAR(leftEye);
    const rightEAR = calculateEAR(rightEye);
    const avgEAR = (leftEAR + rightEAR) / 2;

    const BLINK_THRESHOLD = 0.23;

    if (avgEAR < BLINK_THRESHOLD) {
      blinkDetected.current = true;
    }*/
    })
                    

    },200);
  };
  const captureImage = () => {
    const video = videoRef.current;

    if (video) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext('2d',  { willReadFrequently: true });
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Draw detections and expressions on the canvas
      if (detections.length > 0) {
        const resizedDetections = faceapi.resizeResults(detections, {
          width: canvas.width,
          height: canvas.height,
        });
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
      }

      const dataUrl = canvas.toDataURL('image/jpg');
      setCapturedImages([...capturedImages, dataUrl]);

      const byteString = atob(dataUrl.split(',')[1]);
      const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });

      const formData = new FormData();
      formData.append('image', blob, 'capture.jpg');

      

     /* fetch('http://localhost:8001/upload', {
        method: 'POST',
        body: formData,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to upload image.');
          }
          return response.json();
        })
        .then((data) => {
          console.log('Image saved successfully', data);
        })
        .catch((error) => {
          console.error('Error saving image:', error);
        });*/
    }
  };
  
 /* const getStoredFaceDescriptor = async () => {
    const img = await faceapi.fetchImage('/uploads/WhatsApp Image 2025-03-09 at 23.20.44(1).jpeg');
    const detection = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();
    return detection?.descriptor;
  };
  */
  const getStoredFaceDescriptor = async () => {
    
   /*const imagePaths = [
      "/uploads/20250212_073432.jpg",
      "/uploads/WhatsApp Image 2025-03-09 at 23.20.44(1).jpeg",
      "/uploads/DSCN1315.JPG",
      "/uploads/WhatsApp Image 2025-03-28 at 14.06.17(1).jpeg",
      // Add more image paths here
    ];*/
    try{
    const response = await fetch(`${BASE_URL}/filenames`);
      const filenamesString = await response.text();
      const filenames = filenamesString.split(",").map(file => `/uploads/${file.trim()}`);

    
    
   
       
    const descriptors = [];
   

  for (let path of filenames) {
    const img = await faceapi.fetchImage(path);
    const detection = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (detection) {
      const name = path.split("/").pop(); // filename as label
      descriptors.push(new faceapi.LabeledFaceDescriptors(name, [detection.descriptor]));
    }
  }

  return descriptors;
} catch(error){
  console.error("Error loading filenames or descriptors:", error);
  return [];
}
    
  };
  const stopWebcamVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
  
      tracks.forEach((track) => track.stop());  // Stop each track (audio/video)
  
      // Optionally, reset the video source to stop it from rendering
      videoRef.current.srcObject = null;
    }
  };

  const compareFaces = async () => {

   /* if (!blinkDetected.current) {
    setMatchResult("Please blink to proceed with login.");
    return;
  }*/

    const storedDescriptor = await getStoredFaceDescriptor();
    if (!storedDescriptor) {
      setMatchResult("No face found in stored image.");
      return;
    }

    if (videoRef.current && videoRef.current.readyState >= 2 && videoRef.current.srcObject){
    
    
    const detections = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor()
      .withFaceExpressions();
   
      
      


    if (!detections) {
      setMatchResult("No face detected in webcam.");
      return;
    }
    const expressions = detections.expressions;
    const mood = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
    setMood(mood);
    console.log("Detected Mood:", mood);
    const faceMatcher = new faceapi.FaceMatcher(storedDescriptor, 0.6);
    const bestMatch = faceMatcher.findBestMatch(detections.descriptor);
    //setMatchResult(`Match Result: ${bestMatch.toString()}`);
    const matchedImageFilename = bestMatch.label;
    const encodedImageName = encodeURIComponent(matchedImageFilename)
    console.log("Best matched image:", encodedImageName);
    
    const response = await fetch(`${BASE_URL}/find-user?image=${encodedImageName}`);
    const user = await response.json();
   
      
    console.log("user:", user)
    if (user && user.name) {
     setMatchResult(`Successfully logged in ✅`); // assuming user document has name
     setTimeout(() => {
      // Navigate to the profile page
      navigate('/profile', { state: { imageName: encodedImageName, detectedMood: mood  } }); // Assuming the profile page is at '/profile'
      
    }, 1000);

    } else {
     setMatchResult("User not registered! Please register ⬆️");
    }
  } else {
    setMatchResult("Video is not ready.");
  }
  };

  const handleRegisterClick = () => {
    setShowForm(true); // Show the registration form
  };
  const handleCloseForm = () => {
    setShowForm(false); // Close the registration form
  };



  /*const captureImage = () => {
    const context = canvasRef.current.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    const dataURL = canvasRef.current.toDataURL('userImage/png');

    // Send the image to the backend for comparison
    axios.post('http://localhost:8001/facelogin', { image: dataURL })
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
  };*/

  return (
    <div>
    <div className="myapp">
    {/* Logo added here */}
      <img
        src={`${import.meta.env.BASE_URL}uploads/WhatsApp Image 2025-06-02 at 21.36.19.jpeg`}
        alt="FACADE Logo"
        style={{
          position: 'absolute', // Position absolutely within the parent
          top: '20px',          // 20px from the top
          left: '20px',         // 20px from the left
          width: '170px',       // Adjust size as needed
          height: 'auto',
          zIndex: 10,           // Ensure it's above other elements if needed
          // Optional additional styles:
          borderRadius: '50%',
          border:'7px solid black',
          backgroundColor: 'rgba(255, 255, 255, 0.7)', // Light background for contrast
          padding: '5px',
        }}
      />
    <br></br> <br></br><br></br>
    <h1 className='heading'>FACADE 🎦</h1>
      <div className="appvide">
        
      <button className='bttn' ><video crossOrigin="anonymous" ref={videoRef} autoPlay></video></button>
      </div>
      <canvas ref={canvasRef} width="940" height="650"
      className="appcanvas"/>
      </div>
      <div className='regBttn'> <br></br> 
      
      <button onClick={() => setShowRegisterForm(true)}>Registration</button>
      
      
      <button onClick={compareFaces} className='loginBttn'>Login</button>
     
      <p>{matchResult}</p>
      </div> 
      {showRegisterForm && (
  <div className="registration-overlay">
    <div className="registration-form">
      <button className="close-button" onClick={() => setShowRegisterForm(false)}>❌</button>
      <Register onSuccess={() => setShowRegisterForm(false)} />
    </div>
  </div>
)}
      
      <div className="captured-images-container">
        {capturedImages.map((image, index) => (
          <img
            key={index}
            src={image}
            alt={`Captured ${index}`}
            className="captured-image"
          />
        ))}
      </div>

      
      </div>
   
    )

}

export default Home;
