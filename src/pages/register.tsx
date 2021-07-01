import { useContext, useState, useEffect } from 'react'
import { StateContext } from '../data/state-provider'
import { registerUser, getMessage } from '../data/actions'
import labels from '../data/labels'
import { IonContent, IonFab, IonFabButton, IonIcon, IonInput, IonItem, IonLabel, IonList, IonPage, IonSelect, IonSelectOption, useIonLoading, useIonToast } from '@ionic/react'
import Header from './header'
import { useHistory, useLocation, useParams } from 'react-router'
import { patterns } from '../data/config'
import { checkmarkOutline } from 'ionicons/icons'

type Params = {
  type: string
}
const Register = () => {
  const { state } = useContext(StateContext)
  const params = useParams<Params>()
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [storeName, setStoreName] = useState('')
  const [regionId, setRegionId] = useState('')
  const [nameInvalid, setNameInvalid] = useState(true)
  const [passwordInvalid, setPasswordInvalid] = useState(true)
  const [mobileInvalid, setMobileInvalid] = useState(true)
  const [regions] = useState(() => [...state.regions].sort((l1, l2) => l1.ordering - l2.ordering))
  const history = useHistory()
  const location = useLocation()
  const [message] = useIonToast()
  const [loading, dismiss] = useIonLoading()
  useEffect(() => {
    setPasswordInvalid(!password || !patterns.password.test(password))
  }, [password])
  useEffect(() => {
    setNameInvalid(!name || !patterns.name.test(name))
  }, [name])
  useEffect(() => {
    setMobileInvalid(!mobile || !patterns.mobile.test(mobile))
  }, [mobile])

  const handleRegister = async () => {
    try{
      loading()
      await registerUser(mobile, name, storeName, regionId, password)
      dismiss()
      message(labels.registerSuccess, 3000)
      history.replace('/')
    } catch (err){
      dismiss()
      message(getMessage(location.pathname, err), 3000)
    }
  }

  return (
    <IonPage>
      <Header title={labels.newUser} />
      <IonContent fullscreen className="ion-padding">
        <IonList>
          <IonItem>
            <IonLabel position="floating" color={nameInvalid ? 'danger' : 'primary'}>
              {labels.name}
            </IonLabel>
            <IonInput 
              value={name} 
              type="text" 
              placeholder={labels.namePlaceholder}
              autofocus
              clearInput
              onIonChange={e => setName(e.detail.value!)} 
              color={nameInvalid ? 'danger' : ''}
            />
          </IonItem>
          <IonItem>
            <IonLabel position="floating" color={mobileInvalid ? 'danger' : 'primary'}>
              {labels.mobile}
            </IonLabel>
            <IonInput 
              value={mobile} 
              type="number" 
              placeholder={labels.mobilePlaceholder}
              clearInput
              onIonChange={e => setMobile(e.detail.value!)} 
              color={mobileInvalid ? 'danger' : ''}
            />
          </IonItem>
          <IonItem>
            <IonLabel position="floating" color={passwordInvalid ? 'danger' : 'primary'}>
              {labels.password}
            </IonLabel>
            <IonInput 
              value={password} 
              type="number" 
              placeholder={labels.passwordPlaceholder}
              clearInput
              onIonChange={e => setPassword(e.detail.value!)} 
              color={passwordInvalid ? 'danger' : ''}
            />
          </IonItem>
          {params.type === 'o' &&
            <IonItem>
              <IonLabel position="floating" color="primary">
                {labels.storeName}
              </IonLabel>
              <IonInput 
                value={storeName} 
                type="text" 
                clearInput
                onIonChange={e => setStoreName(e.detail.value!)} 
              />
            </IonItem>
          }
          <IonItem>
            <IonLabel position="floating" color="primary">{labels.region}</IonLabel>
            <IonSelect 
              ok-text={labels.ok} 
              cancel-text={labels.cancel} 
              value={regionId}
              onIonChange={e => setRegionId(e.detail.value)}
            >
              {regions.map(r => <IonSelectOption key={r.id} value={r.id}>{r.name}</IonSelectOption>)}
            </IonSelect>
          </IonItem>
        </IonList>
      </IonContent>
      {regionId && (params.type === 'n' || storeName) && !nameInvalid && !mobileInvalid && !passwordInvalid &&
        <IonFab vertical="top" horizontal="end" slot="fixed">
          <IonFabButton onClick={handleRegister} color="success">
            <IonIcon ios={checkmarkOutline} />
          </IonFabButton>
        </IonFab>
      }
    </IonPage>
  )
}
export default Register
