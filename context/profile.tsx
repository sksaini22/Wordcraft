import { createContext, ReactNode, useEffect, useState } from 'react';
import { IProfileData } from '@/types';
import { auth, database } from '@/config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, child, get } from 'firebase/database';
import { useRouter } from 'next/router';
import { Spinner } from '@/components';
import { toast } from 'react-toastify';

interface ProfileProviderProps {
  children: ReactNode;
}

export const ProfileContext = createContext<IProfileData>({
  name: '',
  email: '',
  photo: '',
  userId: '',
  role: 'reader',
  login: false,
});

const ProfileProvider = ({ children }: ProfileProviderProps) => {
  const [status, setStatus] = useState<'loading' | "success" | 'error'>('loading');

  const [profileData, setProfileData] = useState<IProfileData>({
    name: '',
    email: '',
    photo: '',
    userId: '',
    role: 'reader',
    login: false,
  });

  // get user profile data from firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          setStatus('loading');
          const profileRef = child(ref(database), `users/${user.uid}/profile`);
          const snapshot = await get(profileRef);

          if (snapshot.exists()) {
            const data = snapshot.val() as IProfileData;
            setProfileData({
              email: data.email,
              photo: data.photo,
              name: data.name,
              userId: user.uid,
              role: data.role,
              login: true,
            });
            setStatus('success');
          } else {
            console.log('No data available');
            setProfileData({
              ...profileData,
              login:true
            });
            setStatus('error');
          }
        } catch (error) {
          console.error(error);
          setStatus('error');
        }
      } else {
        setProfileData({
          ...profileData,
          login: false,
        });
        setStatus('success');
      }
    });
    return () => unsubscribe();
  }, []);

  // redirect if user is visited to restricted links
  const router = useRouter();

  const restrictedLinks = ['/write', '/profile', '/edit'];
  const restrictedIfLogedIn = ['/login', '/signup']

  useEffect(() => {
    const timeOut = setTimeout(() => {
      const isRestrictedPage = restrictedLinks.some(link => router.pathname.startsWith(link));
      const isLoginRestrictedPage = restrictedIfLogedIn.some(link => router.pathname.startsWith(link));

      if (!profileData.login && isRestrictedPage) {
        toast.warning('You need to login first');
        router.push('/login');
      }
      else if (profileData.login && isLoginRestrictedPage) {
        toast.info('You are already logged in');
        router.push('/');
      }
    }, 1000);
    return () => clearTimeout(timeOut);
  }, [profileData.login,router.pathname]);

  return (
    <ProfileContext.Provider value={profileData}>
      {status === "loading" ? <Spinner /> : children}
    </ProfileContext.Provider>
  );
};

export default ProfileProvider;
