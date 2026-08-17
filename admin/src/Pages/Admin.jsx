import React from "react";
import "./CSS/Admin.css";
import Sidebar from "../Components/Sidebar/Sidebar";
import AddProduct from "../Components/AddProduct/AddProduct";
import { Route, Routes } from "react-router-dom";
import ListProduct from "../Components/ListProduct/ListProduct";
import ManageOrders from "../Components/ManageOrders/ManageOrders";
import ManageComplaints from "../Components/ManageComplaints/ManageComplaints";
import Analytics from "../Components/Analytics/Analytics";

const Admin = () => {

  return (
    <div className="admin">
      <Sidebar />
      <Routes>
        <Route path="/addproduct" element={<AddProduct />} />
        <Route path="/listproduct" element={<ListProduct />} />
        <Route path="/manageorders" element={<ManageOrders />} />
       <Route path="/managecomplaints" element={<ManageComplaints />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </div>
  );
};

export default Admin;
