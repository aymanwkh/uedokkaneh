import { useEffect, useState } from 'react'
import { editOrder, getMessage, quantityDetails } from '../data/actions'
import labels from '../data/labels'
import { setup, colors } from '../data/config'
import { CustomerInfo, Err, Order, OrderPack, Pack, State } from '../data/types'
import { IonBadge, IonButton, IonButtons, IonContent, IonIcon, IonImg, IonItem, IonLabel, IonList, IonPage, IonText, IonThumbnail, useIonToast } from '@ionic/react'
import Header from './header'
import Footer from './footer'
import { useHistory, useLocation, useParams } from 'react-router'
import { addOutline, removeOutline } from 'ionicons/icons'
import { useSelector, useDispatch } from 'react-redux'

type Params = {
  id: string
}
const EditOrder = () => {
  const params = useParams<Params>()
  const dispatch = useDispatch()
  const stateOrders = useSelector<State, Order[]>(state => state.orders)
  const statePacks = useSelector<State, Pack[]>(state => state.packs)
  const stateOrderBasket = useSelector<State, OrderPack[]>(state => state.orderBasket)
  const stateCustomerInfo = useSelector<State, CustomerInfo | undefined>(state => state.customerInfo)
  const [order] = useState(() => stateOrders.find(o => o.id === params.id))
  const [orderBasket, setOrderBasket] = useState<OrderPack[]>([])
  const [total, setTotal] = useState(0)
  const [overLimit, setOverLimit] = useState(false)
  const [hasChanged, setHasChanged] = useState(false)
  const history = useHistory()
  const location = useLocation()
  const [message] = useIonToast()
  const [customerOrdersTotals] = useState(() => {
    const activeOrders = stateOrders.filter(o => ['n', 'a', 'e', 'f', 'p'].includes(o.status))
    return activeOrders.reduce((sum, o) => sum + o.total, 0)
  })
  useEffect(() => {
    if (order) {
      const basket = order.basket.map(p => {
        return {
          ...p,
          oldQuantity: p.quantity
        }
      })
      dispatch({type: 'LOAD_ORDER_BASKET', payload: basket})
    }
  }, [dispatch, order])
  useEffect(() => {
    setOrderBasket(() => {
      const basket = stateOrderBasket?.filter(p => p.quantity > 0) || []
      return basket.map(p => {
        const packInfo = statePacks.find(pa => pa.id === p.packId)
        return {
          ...p,
          packInfo
        }
      })
    })
  }, [stateOrderBasket, statePacks])
  useEffect(() => {
    setHasChanged(() => stateOrderBasket?.find(p => p.oldQuantity !== p.quantity) ? true : false)
  }, [stateOrderBasket])
  useEffect(() => {
    setTotal(() => orderBasket.reduce((sum, p) => sum + p.gross, 0))
  }, [orderBasket])
  useEffect(() => {
    const orderLimit = stateCustomerInfo?.orderLimit ?? setup.orderLimit
    if (customerOrdersTotals + total > orderLimit){
      setOverLimit(true)
    } else {
      setOverLimit(false)
    }
  }, [stateCustomerInfo, customerOrdersTotals, total])

  const handleSubmit = () => {
    try{
      if (stateCustomerInfo?.isBlocked) {
        throw new Error('blockedUser')
      }
      if (order) {
        editOrder(order, stateOrderBasket)
        message(order.status === 'n' ? labels.editSuccess : labels.sendSuccess, 3000)
        dispatch({type: 'CLEAR_ORDER_BASKET'})
        history.goBack()  
      }
    } catch(error) {
      const err = error as Err
			message(getMessage(location.pathname, err), 3000)
		}
  }
  return (
    <IonPage>
      <Header title={labels.editOrder} />
      <IonContent fullscreen>
        <IonList className="ion-padding">
          {orderBasket.map(p =>
            <IonItem key={p.packId}>
              <IonThumbnail slot="start">
                <IonImg src={p.imageUrl} alt={labels.noImage} />
              </IonThumbnail>
              <IonLabel>
                <IonText style={{color: colors[0].name}}>{p.productName}</IonText>
                <IonText style={{color: colors[1].name}}>{p.productAlias}</IonText>
                <IonText style={{color: colors[2].name}}>{p.packName}</IonText>
                <IonText style={{color: colors[3].name}}>{`${labels.unitPrice}: ${(p.price / 100).toFixed(2)}`}</IonText>
                <IonText style={{color: colors[4].name}}>{quantityDetails(p)}</IonText>
                <IonText style={{color: colors[5].name}}>{`${labels.price}: ${(p.gross / 100).toFixed(2)}`}</IonText>
                {!p.packInfo && <IonBadge color="danger">{labels.unAvailableNote}</IonBadge>}
              </IonLabel>
              {p.packInfo && <>
                <IonButtons slot="end" onClick={() => dispatch({type: 'DECREASE_ORDER_QUANTITY', payload: p})}>
                  <IonIcon 
                    ios={removeOutline} 
                    color="primary" 
                    style={{fontSize: '25px', marginRight: '5px'}} 
                  />
                </IonButtons>
                <IonButtons slot="end" onClick={() => dispatch({type: 'INCREASE_ORDER_QUANTITY', payload: p})}>
                  <IonIcon 
                    ios={addOutline} 
                    color="primary" 
                    style={{fontSize: '25px', marginRight: '5px'}} 
                  />
                </IonButtons>
              </>}
            </IonItem>    
          )}
        </IonList>
      </IonContent>
      {(!overLimit && hasChanged) &&
        <div className="ion-text-center">
          <IonButton 
            fill="solid" 
            shape="round"
            color="secondary"
            style={{width: '10rem'}}
            onClick={handleSubmit}
          >
            {`${labels.submit} ${(total / 100).toFixed(2)}`}
          </IonButton>
        </div>
      }
      {overLimit && 
        <div className="ion-text-center">
          <IonButton 
            fill="solid" 
            shape="round"
            color="danger"
            style={{width: '10rem'}}
            onClick={() => history.push('/help/ol')}
          >
            {labels.limitOverFlowNote}
          </IonButton>
        </div>
      }
      <Footer />
    </IonPage>
  )
}
export default EditOrder
