import React from 'react'
import './Sidebar.css'
import add_product_icon from '../Assets/Add_Product.svg'
import list_product_icon from '../Assets/Product_List.svg'
import order_icon from '../Assets/Manage_Orders.svg'
import complaints_icon from '../Assets/Complaints.svg'
import analytics_icon from '../Assets/Analytics.svg'
import { backend_url } from '../../App'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const Sidebar = () => {
  const [unreadComplaints, setUnreadComplaints] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      const res = await fetch(`${backend_url}/admin/complaints/unread`);
      const data = await res.json();
      setUnreadComplaints(data.count);
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000); // check every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className='sidebar'>
      <Link to='/addproduct' style={{ textDecoration: 'none' }}>
        <div className="sidebar-item">
          <img src={add_product_icon} alt="" />
          <p>Add Product</p>
        </div>
      </Link>
      <Link to='/listproduct' style={{ textDecoration: 'none' }}>
        <div className="sidebar-item">
          <img src={list_product_icon} alt="" />
          <p>Product List</p>
        </div>
      </Link>
    <Link to='/manageorders' style={{ textDecoration: 'none' }}>
        <div className="sidebar-item">
          <img src={order_icon} alt="" />
          <p>Manage Orders</p>
        </div>
      </Link>
    <Link to='/managecomplaints' style={{ textDecoration: 'none' }}>
        <div className="sidebar-item">
          <img src={complaints_icon} alt="" />
          <p>Complaints</p>
          {unreadComplaints > 0 && <span className="sidebar-badge">{unreadComplaints}</span>}
        </div>
      </Link>
      <Link to='/analytics' style={{ textDecoration: 'none' }}>
        <div className="sidebar-item">
          <img src={analytics_icon} alt="" />
          <p>Analytics</p>
        </div>
      </Link>
      
    </div>
  )
}

export default Sidebar
