import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ScrollToTop from './components/ScrollToTop'
import GlobalOverview from './pages/GlobalOverview'
import ParishDashboard from './pages/ParishDashboard'
import ScorecardView from './pages/ScorecardView'
import EmergencyProtocols from './pages/EmergencyProtocols'
import Contacts from './pages/Contacts'
import './App.css'

function App() {
  return (
    <>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<GlobalOverview />} />
          <Route path="/parish/:parishId" element={<ParishDashboard />} />
          <Route path="/parish/:parishId/scorecard" element={<ScorecardView />} />
          <Route path="/scorecard" element={<ScorecardView />} />
          <Route path="/protocols" element={<EmergencyProtocols />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/parish/:parishId/contacts" element={<Contacts />} />
        </Routes>
      </Layout>
    </>
  )
}

export default App

