import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { RegionProvider } from './context/RegionContext'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import './index.css'
import './styles/dris-dashboard.css'
import { logActiveClientDataSourcesIfEnabled } from './lib/activeClientDataSources'

logActiveClientDataSourcesIfEnabled()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RegionProvider>
          <App />
        </RegionProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)



