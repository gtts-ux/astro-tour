const path=require('node:path');
function locationHelper(platform,packaged,resources,source){
 if(platform==='darwin')return packaged?path.join(resources,'..','Frameworks','Astro Tour Location.app','Contents','MacOS','AstroTourLocation'):path.join(source,'native','astro-location');
 if(platform==='win32')return packaged?path.join(resources,'native','AstroTourLocation.exe'):path.join(source,'native','AstroTourLocation.exe');
 throw Error('Automatic location is supported on macOS and Windows. Choose a place on the Map.');
}
module.exports={locationHelper};
