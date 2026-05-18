import { createBrowserRouter } from "react-router-dom";

import MainLayout from "../components/Layout/MainLayout/MainLayout";

export const Router = createBrowserRouter ([
 {
   path:"",
   element:<MainLayout />,
   children:[
    { index: true, element: {  } },
    { path: "", element: {  } },
   ]
 },
]);