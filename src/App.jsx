import Header from './components/Header/Header'
import Configurator from './components/Configurator/Configurator'
import Parameters from './components/Parameters/Parameters'
import Footer from './components/Footer/Footer'
import './index.css'

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
