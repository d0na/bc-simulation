import { useState } from 'react'
import reactLogo from './assets/react.svg'
import bcLogo from './assets/blockchain-10000.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://" target="_blank">
          <img src={bcLogo} className="logo" alt="React logo" />
        </a>
      </div>
      <h1>Block chain Simulation (BC Simulation)</h1>
      <div className="card">
        <p>
          Launch your simulation
        </p>
      </div>
      {/* <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p> */}
      <button onClick={() => setCount((count) => count + 1)}>
        Simulation
      </button>
    </>
  )
}

export default App
