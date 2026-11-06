import React, { useEffect, useState } from 'react'
import Hero from '../Components/Hero/Hero'
import Popular from '../Components/Popular/Popular'
import Offers from '../Components/Offers/Offers'
import NewCollections from '../Components/NewCollections/NewCollections'
import NewsLetter from '../Components/NewsLetter/NewsLetter'
import PromoTab from '../Components/PromoTab/PromoTab'
import { fetchWithRetry } from '../fetchWithRetry'

const Shop = () => {

  const [popular, setPopular] = useState([]);
  const [newcollection, setNewCollection] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInfo = () => { 
        fetchWithRetry('https://eternal-youth-ecommerce-1.onrender.com/popularinwomen')
            .then((res) => res.json()) 
                        .then((data) => { if (Array.isArray(data)) setPopular(data); })
            .catch(() => {})
            .finally(() => setLoading(false))
        fetchWithRetry('https://eternal-youth-ecommerce-1.onrender.com/newcollections')
            .then((res) => res.json()) 
                        .then((data) => { if (Array.isArray(data)) setNewCollection(data); })
            .catch(() => {})
    }

    useEffect(() => {
      fetchInfo();
    }, [])


return (
    <div>
            <Hero/>
      {loading && popular.length === 0 && (
        <p style={{ textAlign: 'center', padding: '40px 20px', color: '#777' }}>
          Loading our collection... the server is waking up, this can take up to a minute.
        </p>
      )}
      <Popular data={popular}/>
      <Offers/>
      <NewCollections data={newcollection}/>
      <NewsLetter/>
      <PromoTab />
    </div>
  )
}

export default Shop
