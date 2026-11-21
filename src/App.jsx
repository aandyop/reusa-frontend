import { useState } from 'react'
import './index.css'
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      {/* Aquí irán la barra superior, el FeedPage, EventsPage, BlogPage y ProfilePage */}
    </AuthProvider>
  );
}