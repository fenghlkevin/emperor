import Foundation
import Vision
import ImageIO
let root=URL(fileURLWithPath:CommandLine.arguments[1],isDirectory:true)
var result:[String:Any]=[:]
func average(_ region:VNFaceLandmarkRegion2D?,_ box:CGRect,_ w:Double,_ h:Double)->[Double]?{guard let r=region,r.pointCount>0 else{return nil};let points=r.normalizedPoints;let x=points.reduce(0.0){$0+Double($1.x)}/Double(r.pointCount);let y=points.reduce(0.0){$0+Double($1.y)}/Double(r.pointCount);return [(box.minX+x*box.width)*w,(1-box.minY-y*box.height)*h]}
for dir in try FileManager.default.contentsOfDirectory(at:root,includingPropertiesForKeys:nil) where dir.hasDirectoryPath {
 var heads:[String:Any]=[:]
 for i in 0..<5 {let url=dir.appendingPathComponent("head-\(i).png");guard let source=CGImageSourceCreateWithURL(url as CFURL,nil),let image=CGImageSourceCreateImageAtIndex(source,0,nil) else{continue};let request=VNDetectFaceLandmarksRequest();request.usesCPUOnly=true;do{try VNImageRequestHandler(cgImage:image,options:[:]).perform([request]);if let face=request.results?.max(by:{$0.confidence<$1.confidence}),let landmarks=face.landmarks,let left=average(landmarks.leftEye,face.boundingBox,Double(image.width),Double(image.height)),let right=average(landmarks.rightEye,face.boundingBox,Double(image.width),Double(image.height)),let mouth=average(landmarks.outerLips,face.boundingBox,Double(image.width),Double(image.height)){heads[String(i)]=["leftEye":left,"rightEye":right,"mouth":mouth,"box":[face.boundingBox.minX*Double(image.width),(1-face.boundingBox.maxY)*Double(image.height),face.boundingBox.width*Double(image.width),face.boundingBox.height*Double(image.height)],"width":image.width,"height":image.height]}}catch{fputs("landmark error: \(url.lastPathComponent): \(error)\n",stderr)}
 }
 if !heads.isEmpty{result[dir.lastPathComponent]=heads}
}
let data=try JSONSerialization.data(withJSONObject:result,options:[.prettyPrinted,.sortedKeys]);try data.write(to:URL(fileURLWithPath:CommandLine.arguments[2]));print("Detected landmarks for \(result.count) countries")
