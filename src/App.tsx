// App.tsx
import { useState, useEffect } from 'react';
import IrrigationProjectForm from './components/IrrigationProjectForm/irrigationProjectForm';
import ProjectDetails from './components/ProjectDetails/ProjectDetails';
import ManageUsers from "./components/Header/manageUsers";
import Header from './components/Header/Header';
import IrrigationLogin from './components/IrrigationLogin/irrigationLogin';
import ResetPassword from './components/IrrigationLogin/resetPassword';
import { isAuthenticated, getCurrentUser, logout } from './graphql/client';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<'home' | 'form' | 'details' | 'users'>('home');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Check authentication on mount
  useEffect(() => {
    if (isAuthenticated()) {
      const user = getCurrentUser();
      setCurrentUser(user);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLoginSuccess = (token: string, user: any) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentPage('home');
    setSelectedProjectId(null);
  };

  const handleProjectSubmit = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentPage('details');
  };

  const navigateTo = (page: 'home' | 'form' | 'details' | 'users') => {
    console.log('Navigating to:', page);
    setCurrentPage(page);
  };

  // Login Page
  if (!isLoggedIn) {
    return <IrrigationLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // Home Page
  if (currentPage === 'home') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onNavigate={navigateTo} onLogout={handleLogout} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome Back</h2>
            <p className="text-gray-600">Manage your irrigation projects</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <button
              onClick={() => navigateTo('form')}
              className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left group"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">New Project</h3>
              <p className="text-gray-600">Create a new irrigation project form</p>
            </button>
            
            <button
              onClick={() => navigateTo('details')}
              className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left group"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Project Details</h3>
              <p className="text-gray-600">View and manage project details</p>
            </button>

            {currentUser?.role === 'Administrator' && (
              <button
                onClick={() => navigateTo('users')}
                className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left group"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Manage Users</h3>
                <p className="text-gray-600">Add and manage user accounts</p>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Project Form Page
  if (currentPage === 'form') {
    return (
      <div className="min-h-screen bg-gray-50">
        <IrrigationProjectForm onSubmit={handleProjectSubmit} onNavigate={navigateTo} />
      </div>
    );
  }

  // Manage Users Page
  if (currentPage === 'users') {
    return (
      <div className="min-h-screen bg-gray-50">
        <ManageUsers onNavigate={navigateTo} onLogout={handleLogout} />
      </div>
    );
  }

  // Project Details Page (default)
  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectDetails projectId={selectedProjectId || undefined} onNavigate={navigateTo} />
    </div>
  );
}

export default App;