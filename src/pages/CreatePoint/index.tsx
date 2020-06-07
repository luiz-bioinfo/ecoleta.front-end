import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { LeafletMouseEvent } from 'leaflet';
import { Map, TileLayer, Marker } from 'react-leaflet';
import axios from 'axios';
import api from '../../services/api';
import Dropzone from '../../components/Dropzone';

import './styles.css';

import logo from '../../assets/logo.svg';

interface Item {
  id: number;
  title: string;
  image_url: string;
}

interface IBGE_UF {
  nome: string;
  sigla: string;
}

interface UF {
  abbr: string;
  name: string;
}

interface IBGE_City {
  nome: string;
}

interface City {
  name: string;
}

interface FormData {
  name: string;
  email: string;
  whatsapp: string;
}

const CreatePoint: React.FC = () => {

  const history = useHistory();

  const [ items, setItems ]   = useState<Item[]>([]),
        [ UFs, setUFs ]       = useState<UF[]>([]),
        [ cities, setCities ] = useState<City[]>([]);
  
  const [ userPosition, setUserPosition ] = useState<[number, number]>([0, 0]);

  const [ selectedUF, setSelectedUF ]             = useState<string>(''),
        [ selectedCity, setSelectedCity ]         = useState<string>(''),
        [ selectedPosition, setSelectedPosition ] = useState<[number, number]>([0, 0]);

  const [selectedFile, setSelectedFile] = useState<File>();

  const [ formData, setFormData ] = useState<FormData>({
    name: '',
    email: '',
    whatsapp: ''
  });

  const [ selectedItems, setSelectedItems ] = useState<number[]>([]);
  
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;
      setUserPosition([ latitude, longitude ]);
    });
  }, []);

  useEffect(() => {
    api.get('/items').then(response => {
      setItems(response.data.data);
    });
  }, []);

  useEffect(() => {
    axios.get<IBGE_UF[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome').then(response => {
      const UFs = response.data.map(UF => {
        return {
          abbr: UF.sigla,
          name: UF.nome
        };
      });

      setUFs(UFs);
    });
  }, []);

  useEffect(() => {
    axios.get<IBGE_City[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUF}/municipios?orderBy=nome`).then(response => {
      const cities = response.data.map(city => {
        return {
          name: city.nome
        };
      });

      setCities(cities);
    });
  }, [selectedUF]);

  function handleSelectedMapPoint(e: LeafletMouseEvent) {
    setSelectedPosition([e.latlng.lat, e.latlng.lng]);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  }

  function handleSelectItem(id: number) {
    const alreadySelected = selectedItems.findIndex(item => item === id);
    if (alreadySelected >= 0) {
      const filteredItems = selectedItems.filter(item => item !== id);
      setSelectedItems(filteredItems);
    }
    else
      setSelectedItems([...selectedItems, id]);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const {
      name,
      email,
      whatsapp
    } = formData;
    const UF = selectedUF;
    const city = selectedCity;
    const [ latitude, longitude ] = selectedPosition;
    const items = selectedItems;

    const data = new FormData();
    data.append('name', name);
    data.append('email', email);
    data.append('whatsapp', whatsapp);
    data.append('UF', UF);
    data.append('city', city);
    data.append('latitude', String(latitude));
    data.append('longitude', String(longitude));
    data.append('items', items.join(','));

    if (selectedFile) {
      data.append("image", selectedFile);
    }

    api.post('/points', data)
      .then(response => {
        alert('Ponto de coleta cadastrado com sucesso!');
        history.push('/');
      })
      .catch(error => {
        alert(error.response.message);
      });
  }

  return (
    <div id="page-create-point">
      <header>
        <img src={logo} alt="Ecoleta" />

        <Link to="/">
            <FiArrowLeft />
            Voltar para home
        </Link>
      </header>

      <form onSubmit={handleSubmit}>
        <h1>Cadastro do <br /> ponto de coleta</h1>
        
      <Dropzone onFileUploaded={setSelectedFile} />

        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>
          <div className="field">
            <label htmlFor="name">Nome da entidade:</label>
            <input
              type="text"
              name="name"
              id="name"
              onChange={handleInputChange}
            />
          </div>
          <div className="field-group">
            <div className="field">
              <label htmlFor="email">E-mail:</label>
              <input
                type="email"
                name="email"
                id="email"
                onChange={handleInputChange}
              />
            </div>
            <div className="field">
              <label htmlFor="whatsapp">WhatsApp:</label>
              <input
                type="text"
                name="whatsapp"
                id="whatsapp"
                onChange={handleInputChange}
              />
            </div>
          </div>
        </fieldset>
        
        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereço no mapa</span>
          </legend>

          <Map center={userPosition} zoom={15} onClick={handleSelectedMapPoint} >
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={selectedPosition} />
          </Map>

          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado (UF):</label>
              <select
                name="uf"
                id="uf"
                value={selectedUF}
                onChange={ e => setSelectedUF(e.target.value) }
              >
                <option value="0">Selecione uma UF</option>
                {
                  UFs.map(UF => (
                    <option
                      key={UF.abbr}
                      value={UF.abbr}
                    >
                      {UF.name}
                    </option>
                  ))
                }
              </select>
            </div>
            <div className="field">
              <label htmlFor="city">Cidade:</label>
              <select
                name="city"
                id="uccityityf"
                value={selectedCity}
                onChange={ e => setSelectedCity(e.target.value) }
              >
                <option value="0">Selecione uma cidade</option>
                {
                  cities.map(city => (
                    <option
                      key={city.name}
                      value={city.name}
                    >
                      {city.name}
                    </option>
                  ))
                }
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Items de coleta</h2>
            <span>Selecione um ou mais items abaixo</span>
          </legend>
          <ul className="items-grid">
            {
              items.map(item => (
                <li
                  key={item.id}
                  onClick={ e => handleSelectItem(item.id) }
                  className={ selectedItems.includes(item.id) ? 'selected' : '' }
                >
                  <img src={item.image_url} alt={item.title} />
                  <span>{item.title}</span>
                </li>
              ))
            }
          </ul>
        </fieldset>
          
        <button type="submit">
          Cadastrar ponto de coleta
        </button>
      </form>
    </div>
  )
};

export default CreatePoint;