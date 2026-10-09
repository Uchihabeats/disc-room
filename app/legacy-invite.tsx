"use client";
import { useEffect } from "react";

// Keep existing invitations working after the console moves to its own route.
export function LegacyInvite(){
 useEffect(()=>{
  if(new URLSearchParams(location.search).has('room')){
   location.replace('/play/ps1'+location.search+location.hash);
  }
 },[]);
 return null;
}
