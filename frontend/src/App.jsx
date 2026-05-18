import { RouterProvider } from 'react-router-dom';
import { Router } from './router/Router';
import { GeneralContextProvider } from './context/Context';
import './App.css'

function App() {

  return (
    <>
      <GeneralContextProvider>
        <RouterProvider router={ Router }/>
      </GeneralContextProvider>
    </>
  );
}

export default App;
