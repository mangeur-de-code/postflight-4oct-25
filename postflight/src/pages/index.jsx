import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import FlightLog from "./FlightLog";

import Profile from "./Profile";

import Reports from "./Reports";

import UploadFlights from "./UploadFlights";

import Instructions from "./Instructions";

import Aircraft from "./Aircraft";

import Home from "./Home";

import Requirements from "./Requirements";

import PrivacyPolicy from "./PrivacyPolicy";

import FlightGroup from "./FlightGroup";

import ContactUs from "./ContactUs";

import PublicLogbook from "./PublicLogbook";

import NewFlight from "./NewFlight";

import DataTools from "./DataTools";

import FlightTasks from "./FlightTasks";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    FlightLog: FlightLog,
    
    Profile: Profile,
    
    Reports: Reports,
    
    UploadFlights: UploadFlights,
    
    Instructions: Instructions,
    
    Aircraft: Aircraft,
    
    Home: Home,
    
    Requirements: Requirements,
    
    PrivacyPolicy: PrivacyPolicy,
    
    FlightGroup: FlightGroup,
    
    ContactUs: ContactUs,
    
    PublicLogbook: PublicLogbook,
    
    NewFlight: NewFlight,
    
    DataTools: DataTools,
    
    FlightTasks: FlightTasks,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/FlightLog" element={<FlightLog />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/Reports" element={<Reports />} />
                
                <Route path="/UploadFlights" element={<UploadFlights />} />
                
                <Route path="/Instructions" element={<Instructions />} />
                
                <Route path="/Aircraft" element={<Aircraft />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Requirements" element={<Requirements />} />
                
                <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
                
                <Route path="/FlightGroup" element={<FlightGroup />} />
                
                <Route path="/ContactUs" element={<ContactUs />} />
                
                <Route path="/PublicLogbook" element={<PublicLogbook />} />
                
                <Route path="/NewFlight" element={<NewFlight />} />
                
                <Route path="/DataTools" element={<DataTools />} />
                
                <Route path="/FlightTasks" element={<FlightTasks />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}