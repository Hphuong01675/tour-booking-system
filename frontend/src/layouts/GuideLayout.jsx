import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import GuideHeader from '../components/guide/GuideHeader';
import { getGuideProfile } from '../api/guideApi';

const GuideLayout = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      try {
        const profile = await getGuideProfile();
        if (mounted) setCurrentUser(profile || null);
      } catch (err) {
        console.warn('Unable to fetch guide profile for header:', err);
        if (mounted) setCurrentUser(null);
      }
    };
    fetchProfile();
    return () => { mounted = false; };
  }, []);

  const handleLogoutClick = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <GuideHeader 
        currentUser={currentUser} 
        onLogoutClick={handleLogoutClick} 
      />
      <main className="flex-1 overflow-auto bg-background flex flex-col">
        <Outlet context={{ currentUser }} />
      </main>
    </div>
  );
};

export default GuideLayout;
