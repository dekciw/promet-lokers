import Header from './components/Header'
import Configurator from './components/Configurator'
import Parameters from './components/Parameters'
import Footer from './components/Footer'
import './App.css'

export default function App() {
  return (
    <>
      <Header />
      <div className="layout">
        <Configurator />
        <Parameters />
      </div>
      <Footer />
    </>
  )
}
