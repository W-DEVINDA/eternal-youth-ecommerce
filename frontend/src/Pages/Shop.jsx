import React from 'react'
import Hero from '../Components/Hero/Hero'
import Popular from '../Components/Popular/Popular'
import Offers from '../Components/Offers/Offers'
import NewCollections from '../Components/NewCollections/NewCollections'
import NewsLetter from '../Components/NewsLetter/NewsLetter'
import PromoTab from '../Components/PromoTab/PromoTab'
import { popularInWomen, newCollections } from '../catalog'

const Shop = () => {

  const popular = popularInWomen;
  const newcollection = newCollections;

return (
    <div>
      <Hero/>
      <Popular data={popular}/>
      <Offers/>
      <NewCollections data={newcollection}/>
      <NewsLetter/>
      <PromoTab />
    </div>
  )
}

export default Shop