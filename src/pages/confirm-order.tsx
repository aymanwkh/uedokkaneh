import { useState, useEffect } from 'react'
import { confirmOrder, getMessage, quantityText, getBasket } from '../data/actions'
import labels from '../data/labels'
import { setup, colors } from '../data/config'
import { BasketPack, Discount, BigBasketPack, State, Region, CustomerInfo, UserInfo, Pack, Advert, Order, Err } from '../data/types'
import { useHistory, useLocation } from 'react-router'
import { IonBadge, IonButton, IonContent, IonItem, IonLabel, IonList, IonPage, IonText, useIonToast } from '@ionic/react'
import Header from './header'
import { Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import firebase from '../data/firebase'

const ConfirmOrder = () => {
  const dispatch = useDispatch()
  const stateUser = useSelector<State, firebase.User | undefined>(state => state.user)
  const stateRegions = useSelector<State, Region[]>(state => state.regions)
  const stateCustomerInfo = useSelector<State, CustomerInfo | undefined>(state => state.customerInfo)
  const stateUserInfo = useSelector<State, UserInfo | undefined>(state => state.userInfo)
  const stateBasket = useSelector<State, BasketPack[]>(state => state.basket)
  const statePacks = useSelector<State, Pack[]>(state => state.packs)
  const stateOrders = useSelector<State, Order[]>(state => state.orders)
  const stateAdverts = useSelector<State, Advert[]>(state => state.adverts)
  const [basket, setBasket] = useState<BigBasketPack[]>([])
  const [total, setTotal] = useState(0)
  const [fixedFees, setFixedFees] = useState(0)
  const [fraction, setFraction] = useState(0)
  const [discount, setDiscount] = useState<Discount>()
  const [weightedPacks, setWeightedPacks] = useState<BasketPack[]>([])
  const [regionFees] = useState(() => stateRegions.find(r => r.id === stateUserInfo?.regionId)?.fees ?? 0)
  const [deliveryFees] = useState(stateCustomerInfo?.deliveryFees ?? regionFees)
  const history = useHistory()
  const location = useLocation()
  const [message] = useIonToast()

  useEffect(() => {
    setBasket(getBasket(stateBasket, statePacks))
  }, [stateBasket, statePacks])

  useEffect(() => {
    setTotal(() => basket.reduce((sum, p) => sum + Math.round(p.price * p.quantity), 0))
    setWeightedPacks(() => basket.filter(p => p.byWeight))
  }, [basket])
  useEffect(() => {
    setFixedFees(() => Math.round(setup.fixedFees * total))
  }, [total])
  useEffect(() => {
    setFraction((total + fixedFees) - Math.floor((total + fixedFees) / 5) * 5)
  }, [total, fixedFees])
  useEffect(() => {
    setDiscount(() => {
      const orders = stateOrders.filter(o => o.status !== 'c')
      let discount = {
        value: 0,
        type: 'n'
      }
      if (orders.length === 0) {
        discount.value = setup.firstOrderDiscount
        discount.type = 'f'
      } else if ((stateCustomerInfo?.discounts || 0) > 0) {
        discount.value = Math.min(stateCustomerInfo?.discounts || 0, setup.maxDiscount)
        discount.type = 'o'
      } else if ((stateCustomerInfo?.specialDiscount || 0) > 0) {
        discount.value = stateCustomerInfo?.specialDiscount || 0
        discount.type = 's'
      }
      return discount
    }) 
  }, [stateOrders, stateCustomerInfo])

  const handleConfirm = () => {
    try{
      if (stateAdverts[0]?.type === 'n') {
        message(stateAdverts[0].text, 2000)
        return
      }
      if (stateCustomerInfo?.isBlocked) {
        throw new Error('blockedUser')
      }
      const orderLimit = stateCustomerInfo?.orderLimit || setup.orderLimit
      const activeOrders = stateOrders.filter(o => ['n', 'a', 'e', 'f', 'p'].includes(o.status))
      const totalOrders = activeOrders.reduce((sum, o) => sum + o.total, 0)
      if (totalOrders + total > orderLimit) {
        throw new Error('limitOverFlow')
      }
      const packs = basket.filter(p => p.price > 0)
      const newPacks = packs.map(p => {
        return {
          packId: p.packId,
          productId: p.productId,
          productName: p.productName,
          productAlias: p.productAlias,
          packName: p.packName,
          imageUrl: p.imageUrl,
          price: p.price,
          quantity: p.quantity,
          closeExpired: p.closeExpired,
          byWeight: p.byWeight,
          gross: Math.round(p.price * p.quantity),
          offerId: p.offerId || '',
          purchased: 0,
          status: 'n'
        }
      })
      const order = {
        status: 'n',
        basket: newPacks,
        fixedFees,
        deliveryFees,
        discount,
        total,
        fraction
      }
      confirmOrder(order)
      message(labels.sendSuccess, 3000)
      history.push('/')
      dispatch({ type: 'CLEAR_BASKET'})
    } catch (error){
      const err = error as Err
      message(getMessage(location.pathname, err), 3000)
    }
  }
  if (!stateUser) return <IonPage><h3 className="center"><a href="/login">{labels.relogin}</a></h3></IonPage>
  return (
    <IonPage>
      <Header title={labels.sendOrder} />
      <IonContent fullscreen>
        <p className="note">{labels.orderHelp} <Link to="/help/o">{labels.clickHere}</Link></p>
        {regionFees === 0 ? <p className="note">{labels.noDelivery}</p> : ''}
        <IonList className="ion-padding">
          {basket.map(p => 
            <IonItem key={p.packId}>
              <IonLabel>
                <IonText style={{color: colors[0].name}}>{p.productName}</IonText>
                <IonText style={{color: colors[1].name}}>{p.productAlias}</IonText>
                <IonText style={{color: colors[2].name}}>{p.packName}</IonText>
                <IonText style={{color: colors[3].name}}>{p.priceText}</IonText>
                <IonText style={{color: colors[4].name}}>{`${labels.quantity}: ${quantityText(p.quantity)}`}</IonText>
                {p.closeExpired && <IonBadge color="danger">{labels.closeExpired}</IonBadge>}
              </IonLabel>
              <IonLabel slot="end" className="price">{p.totalPriceText}</IonLabel>
            </IonItem>    
          )}
          <IonItem>
            <IonLabel>
              <IonText style={{color: colors[0].name}}>{labels.total}</IonText>
            </IonLabel>
            <IonLabel slot="end" className="price">{(total / 100).toFixed(2)}</IonLabel>
          </IonItem>    
          <IonItem>
            <IonLabel>
              <IonText style={{color: colors[1].name}}>{labels.fixedFees}</IonText>
            </IonLabel>
            <IonLabel slot="end" className="price">{((fixedFees + deliveryFees) / 100).toFixed(2)}</IonLabel>
          </IonItem>    
          <IonItem>
            <IonLabel>
              <IonText style={{color: colors[2].name}}>{labels.discount}</IonText>
            </IonLabel>
            <IonLabel slot="end" className="price">{(((discount?.value ?? 0) + fraction) / 100).toFixed(2)}</IonLabel>
          </IonItem>    
          <IonItem>
            <IonLabel>
              <IonText style={{color: colors[3].name}}>{labels.net}</IonText>
            </IonLabel>
            <IonLabel slot="end" className="price">{((total + fixedFees + deliveryFees - (discount?.value ?? 0) - fraction) / 100).toFixed(2)}</IonLabel>
          </IonItem>    
        </IonList>
        <p className="note">{weightedPacks.length > 0 ? labels.weightedPricesNote : ''}</p>
      </IonContent>
      <div className="ion-text-center">
        <IonButton 
          fill="solid" 
          shape="round"
          color="secondary"
          style={{width: '10rem'}}
          onClick={handleConfirm}
        >
          {labels.send}
        </IonButton>
      </div>
    </IonPage>
  )
}
export default ConfirmOrder
