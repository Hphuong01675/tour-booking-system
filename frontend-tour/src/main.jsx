import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux' // Import Provider từ react-redux
import store from './store'           // Import store bạn đã tạo
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        {/* Bọc App bằng Provider để các Component bên trong dùng được Redux */}
        <Provider store={store}>
            <App />
        </Provider>
    </StrictMode>,
)