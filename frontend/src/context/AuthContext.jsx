import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth.api';
const AuthContext = createContext(null);
const PREVIEW_KEY='vehiclecare_preview_role';
const previewUser=(role)=>({id:`preview-${role.toLowerCase()}`,name:role==='OWNER'?'Aarav Sharma':role==='MECHANIC'?'QuickFix Workshop':'VehicleCare Admin',email:`${role.toLowerCase()}@preview.vehiclecare`,phone:'',role,isPreview:true,serviceCenter:role==='MECHANIC'?{id:'preview-center',name:'QuickFix Auto Care',city:'Jaipur',slot_capacity:3}:null});
export const AuthProvider=({children})=>{
 const [previewRole,setPreviewRole]=useState(()=>import.meta.env.DEV?localStorage.getItem(PREVIEW_KEY):null);
 const [user,setUser]=useState(()=>{const preview=import.meta.env.DEV?localStorage.getItem(PREVIEW_KEY):null;if(preview)return previewUser(preview);const saved=localStorage.getItem('vehiclecare_user');try{return saved?JSON.parse(saved):null;}catch{return null;}});
 const [token,setToken]=useState(()=>localStorage.getItem('vehiclecare_token'));
 const [loading,setLoading]=useState(true);
 useEffect(()=>{let alive=true;const init=async()=>{const savedToken=localStorage.getItem('vehiclecare_token');if(savedToken){try{const data=await authApi.getProfile();if(alive){setUser(data.user);setPreviewRole(null);localStorage.setItem('vehiclecare_user',JSON.stringify(data.user));}}catch{if(alive){localStorage.removeItem('vehiclecare_token');localStorage.removeItem('vehiclecare_user');setToken(null);setUser(null);}}}if(alive)setLoading(false);};init();return()=>{alive=false;};},[]);
 const login=async(email,password)=>{const data=await authApi.login({email,password});localStorage.removeItem(PREVIEW_KEY);localStorage.setItem('vehiclecare_token',data.token);localStorage.setItem('vehiclecare_user',JSON.stringify(data.user));setPreviewRole(null);setToken(data.token);setUser(data.user);return data.user;};
 const loginDemo=(role)=>{if(!import.meta.env.DEV)throw new Error('Preview sign-in is available only in development.');localStorage.removeItem('vehiclecare_token');localStorage.setItem(PREVIEW_KEY,role);const demo=previewUser(role);localStorage.setItem('vehiclecare_user',JSON.stringify(demo));setToken(null);setPreviewRole(role);setUser(demo);return demo;};
 const register=async(userData)=>{const data=await authApi.register(userData);localStorage.removeItem(PREVIEW_KEY);localStorage.setItem('vehiclecare_token',data.token);localStorage.setItem('vehiclecare_user',JSON.stringify(data.user));setPreviewRole(null);setToken(data.token);setUser(data.user);return data.user;};
 const logout=()=>{localStorage.removeItem('vehiclecare_token');localStorage.removeItem('vehiclecare_user');localStorage.removeItem(PREVIEW_KEY);setPreviewRole(null);setToken(null);setUser(null);};
 return <AuthContext.Provider value={{user,token,loading,login,loginDemo,register,logout,isPreview:!!previewRole,isAuthenticated:!!token||!!previewRole,role:user?.role}}>{children}</AuthContext.Provider>;
};
export const useAuth=()=>{const context=useContext(AuthContext);if(!context)throw new Error('useAuth must be used within an AuthProvider');return context;};
