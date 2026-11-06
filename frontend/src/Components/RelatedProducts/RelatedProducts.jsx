import React from 'react'
import './RelatedProducts.css'
import Item from '../Item/Item'
import { relatedTo } from '../../catalog';

const RelatedProducts = ({category,id}) => {

  const related = relatedTo(category);

  return (
    <div className='relatedproducts'>
      <h1>Related Products</h1>
      <hr />
      <div className="relatedproducts-item">
        {related.map((item,index)=>{
          if (id !== item.id) {
            return <Item key={index} id={item.id} name={item.name} image={item.image}  new_price={item.new_price} old_price={item.old_price}/>
          }
        })}
      </div>
    </div>
  )
}

export default RelatedProducts