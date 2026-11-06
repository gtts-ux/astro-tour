const {packager}=require('@electron/packager');
const {copyFile,chmod,mkdir,writeFile}=require('node:fs/promises');
const {execFileSync}=require('node:child_process');
const path=require('node:path');
(async()=>{
 if(!require('node:fs').existsSync('native/astro-location') || require('node:fs').statSync('native/Location.swift').mtimeMs > require('node:fs').statSync('native/astro-location').mtimeMs)execFileSync('swiftc',['native/Location.swift','-o','native/astro-location','-target',`${(process.env.ASTRO_ARCH||process.arch)==='x64'?'x86_64':'arm64'}-apple-macos12.0`,'-framework','CoreLocation','-framework','AppKit'],{stdio:'inherit'});
 const apps=await packager({dir:'.',name:'Astro Tour',platform:'darwin',arch:process.env.ASTRO_ARCH||process.arch,out:'release',overwrite:true,appBundleId:'com.astrotour.desktop',extendInfo:'mac-info.plist',ignore:[/^\/release($|\/)/,/^\/\.git($|\/)/,/^\/\.github($|\/)/,/^\/\.codex($|\/)/,/^\/native($|\/)/,/screenshot\.png$/,/smoke\.cjs$/,/native-check\.cjs$/]});
 for(const output of apps){
  const bundle=path.join(output,'Astro Tour.app');
  const helperBundle=path.join(bundle,'Contents','Frameworks','Astro Tour Location.app');
  const helper=path.join(helperBundle,'Contents','MacOS','AstroTourLocation');
  await mkdir(path.dirname(helper),{recursive:true});await copyFile('native/astro-location',helper);await chmod(helper,0o755);
  await writeFile(path.join(helperBundle,'Contents','Info.plist'),`<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>CFBundleIdentifier</key><string>com.astrotour.location</string><key>CFBundleName</key><string>Astro Tour Location</string><key>CFBundleDisplayName</key><string>Astro Tour Location</string><key>CFBundleExecutable</key><string>AstroTourLocation</string><key>CFBundlePackageType</key><string>APPL</string><key>CFBundleVersion</key><string>1</string><key>LSUIElement</key><true/><key>NSLocationUsageDescription</key><string>Find your observing location for Astro Tour weather and sky brightness.</string><key>NSLocationWhenInUseUsageDescription</key><string>Find your observing location for Astro Tour weather and sky brightness.</string></dict></plist>`);
  execFileSync('codesign',['--force','--deep','--sign','-',helperBundle],{stdio:'inherit'});
  execFileSync('codesign',['--force','--deep','--sign','-',bundle],{stdio:'inherit'});console.log('Built and locally signed:',bundle)
 }
})().catch(e=>{console.error(e);process.exit(1)});
