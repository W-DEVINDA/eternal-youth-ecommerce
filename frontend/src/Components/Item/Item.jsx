import React from 'react'
import './Item.css'
import { Link } from 'react-router-dom'
import { currency } from '../../App'
import { imgUrl } from '../../catalog'

const Item = (props) => {
  return (
    <div className='item'>
      <Link to={`/product/${props.id}`}><img onClick={window.scrollTo(0, 0)} src={imgUrl(props.image)} alt="products" /></Link>
      <p>{props.name}</p>
      <div className="item-prices">
        <div className="item-price-new">{currency}{props.new_price}</div>
        <div className="item-price-old">{currency}{props.old_price}</div>
      </div>
    </div>
  )
}

export default Item
