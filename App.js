// App.js - Versão COMPLETA e FUNCIONAL para Expo
import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
  Dimensions,
  Image,
  Switch
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

const { width: screenWidth } = Dimensions.get('window');

// Cores do tema original
const colors = {
  navy: '#000000',
  navy2: '#11141b',
  navy3: '#24272c',
  gold: '#C9A84C',
  gold2: '#E8C97A',
  gold3: '#f5e4b0',
  green: '#2D7D5A',
  green2: '#3ca873',
  green3: '#d4f0e4',
  red: '#C0392B',
  orange: '#E67E22',
  purple: '#6C3FC5',
  purple2: '#8B5CF6',
  purple3: '#ede9fe',
  gray1: '#f8f9fb',
  gray2: '#eef0f4',
  gray3: '#d1d5de',
  gray4: '#8a91a0',
  gray5: '#4a5168',
  white: '#ffffff'
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('cadastro');
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adTipo, setAdTipo] = useState('hora');
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', text: '', type: 'ok', onConfirm: null });

  // State do cadastro
  const [cadastro, setCadastro] = useState({
    tipoAdesao: 'Plano Novo',
    plano: '',
    nome: '',
    nasc: '',
    cpf: '',
    rg: '',
    tel: '',
    end: '',
    num: '',
    bairro: '',
    cep: '',
    cidade: '',
    ref: '',
    civil: '',
    rel: '',
    dadesao: new Date().toISOString().split('T')[0],
    dvenc: '',
    valor: '',
    vendedor: '',
    pagamento: '',
    empresaOrigem: '',
    contratoAnt: '',
    tempoAnt: '',
    motivoPort: '',
    dependentes: [],
    fotos: [],
    localizacao: null
  });

  const [adesoes, setAdesoes] = useState([]);
  const [config, setConfig] = useState({ empresa: 'PAX PREVENIR', vendedor: '', cidade: '' });

  // Carregar dados
  useEffect(() => {
    loadData();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      const { status: camStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (locStatus !== 'granted') {
        Alert.alert('Permissão', 'Para capturar GPS, permita o acesso à localização.');
      }
      if (camStatus !== 'granted' || libStatus !== 'granted') {
        Alert.alert('Permissão', 'Para fotos, permita acesso à câmera e galeria.');
      }
    } catch (error) {
      console.error('Erro ao pedir permissões:', error);
    }
  };

  const loadData = async () => {
    try {
      const savedCadastro = await AsyncStorage.getItem('pax_cadastro');
      if (savedCadastro) {
        const parsed = JSON.parse(savedCadastro);
        setCadastro(prev => ({ ...prev, ...parsed, dependentes: parsed.dependentes || [], fotos: parsed.fotos || [] }));
      }
      
      const savedAdesoes = await AsyncStorage.getItem('pax_adesoes');
      if (savedAdesoes) setAdesoes(JSON.parse(savedAdesoes));
      
      const savedConfig = await AsyncStorage.getItem('pax_config');
      if (savedConfig) setConfig(JSON.parse(savedConfig));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  useEffect(() => {
    AsyncStorage.setItem('pax_cadastro', JSON.stringify(cadastro)).catch(console.error);
  }, [cadastro]);

  // Formatações
  const formatCPF = (text) => {
    let v = text.replace(/\D/g, '');
    if (v.length > 3) v = v.slice(0, 3) + '.' + v.slice(3);
    if (v.length > 7) v = v.slice(0, 7) + '.' + v.slice(7);
    if (v.length > 11) v = v.slice(0, 11) + '-' + v.slice(11);
    return v.slice(0, 14);
  };

  const formatPhone = (text) => {
    let v = text.replace(/\D/g, '');
    if (v.length > 0) v = '(' + v;
    if (v.length > 3) v = v.slice(0, 3) + ') ' + v.slice(3);
    if (v.length > 10) v = v.slice(0, 10) + '-' + v.slice(10);
    return v.slice(0, 15);
  };

  const formatMoney = (text) => {
    let v = text.replace(/\D/g, '');
    if (!v) return '';
    const num = (parseInt(v) / 100).toFixed(2);
    return 'R$ ' + num.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  // GPS
  const captureGPS = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Erro', 'Permissão de localização negada');
        setLoading(false);
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      setCadastro(prev => ({
        ...prev,
        localizacao: {
          lat: location.coords.latitude.toFixed(6),
          lng: location.coords.longitude.toFixed(6)
        }
      }));
      Alert.alert('Sucesso', 'Localização capturada!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível capturar a localização: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fotos
  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        base64: false
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        setCadastro(prev => ({
          ...prev,
          fotos: [...prev.fotos, result.assets[0].uri]
        }));
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível tirar a foto');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        base64: false
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        setCadastro(prev => ({
          ...prev,
          fotos: [...prev.fotos, result.assets[0].uri]
        }));
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
  };

  const removeFoto = (index) => {
    setCadastro(prev => ({
      ...prev,
      fotos: prev.fotos.filter((_, i) => i !== index)
    }));
  };

  // Dependentes
  const addDependente = () => {
    setCadastro(prev => ({
      ...prev,
      dependentes: [...prev.dependentes, { nome: '', parentesco: '', nasc: '' }]
    }));
  };

  const updateDependente = (index, field, value) => {
    const newDeps = [...cadastro.dependentes];
    newDeps[index][field] = value;
    setCadastro(prev => ({ ...prev, dependentes: newDeps }));
  };

  const removeDependente = (index) => {
    setCadastro(prev => ({
      ...prev,
      dependentes: prev.dependentes.filter((_, i) => i !== index)
    }));
  };

  // Adesões
  const addAdesao = () => {
    if (!cadastro.nome.trim()) {
      Alert.alert('Erro', 'Preencha o nome do cliente');
      return;
    }
    
    const novaAdesao = {
      id: Date.now(),
      nome: cadastro.nome,
      valor: cadastro.valor,
      venc: cadastro.dvenc,
      vendedor: cadastro.vendedor,
      tipo: adTipo,
      status: adTipo === 'hora' ? 'paga' : 'pendente',
      dataCriacao: new Date().toISOString()
    };
    
    const newAdesoes = [novaAdesao, ...adesoes];
    setAdesoes(newAdesoes);
    AsyncStorage.setItem('pax_adesoes', JSON.stringify(newAdesoes));
    Alert.alert('Sucesso', 'Adesão registrada!');
  };

  const darBaixa = (id) => {
    Alert.alert('Dar Baixa', 'Confirmar pagamento desta adesão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: () => {
          const newAdesoes = adesoes.map(ad => 
            ad.id === id ? { ...ad, status: 'baixada', dataBaixa: new Date().toISOString() } : ad
          );
          setAdesoes(newAdesoes);
          AsyncStorage.setItem('pax_adesoes', JSON.stringify(newAdesoes));
          Alert.alert('Sucesso', 'Baixa registrada!');
        }
      }
    ]);
  };

  const deleteAdesao = (id) => {
    Alert.alert('Excluir', 'Confirmar exclusão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          const newAdesoes = adesoes.filter(ad => ad.id !== id);
          setAdesoes(newAdesoes);
          AsyncStorage.setItem('pax_adesoes', JSON.stringify(newAdesoes));
        }
      }
    ]);
  };

  const salvarAdesao = () => {
    if (!cadastro.nome.trim()) {
      Alert.alert('Erro', 'Preencha o nome do cliente');
      return;
    }
    
    const novaAdesao = {
      id: Date.now(),
      nome: cadastro.nome,
      valor: cadastro.valor,
      venc: cadastro.dvenc,
      vendedor: cadastro.vendedor,
      tipo: 'hora',
      status: 'paga',
      dataCriacao: new Date().toISOString()
    };
    
    const newAdesoes = [novaAdesao, ...adesoes];
    setAdesoes(newAdesoes);
    AsyncStorage.setItem('pax_adesoes', JSON.stringify(newAdesoes));
    Alert.alert('Sucesso', 'Adesão salva no controle!');
  };

  // Limpar formulário
  const clearForm = () => {
    Alert.alert('Limpar Formulário', 'Todos os dados serão apagados. Confirmar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Limpar',
        style: 'destructive',
        onPress: () => {
          setCadastro({
            tipoAdesao: 'Plano Novo',
            plano: '',
            nome: '',
            nasc: '',
            cpf: '',
            rg: '',
            tel: '',
            end: '',
            num: '',
            bairro: '',
            cep: '',
            cidade: '',
            ref: '',
            civil: '',
            rel: '',
            dadesao: new Date().toISOString().split('T')[0],
            dvenc: '',
            valor: '',
            vendedor: '',
            pagamento: '',
            empresaOrigem: '',
            contratoAnt: '',
            tempoAnt: '',
            motivoPort: '',
            dependentes: [],
            fotos: [],
            localizacao: null
          });
        }
      }
    ]);
  };

  const deleteAllData = () => {
    Alert.alert('Apagar Todos os Dados', 'ATENÇÃO: Esta ação é irreversível!', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar Tudo',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();
          setAdesoes([]);
          setCadastro({
            tipoAdesao: 'Plano Novo',
            plano: '',
            nome: '',
            nasc: '',
            cpf: '',
            rg: '',
            tel: '',
            end: '',
            num: '',
            bairro: '',
            cep: '',
            cidade: '',
            ref: '',
            civil: '',
            rel: '',
            dadesao: new Date().toISOString().split('T')[0],
            dvenc: '',
            valor: '',
            vendedor: '',
            pagamento: '',
            empresaOrigem: '',
            contratoAnt: '',
            tempoAnt: '',
            motivoPort: '',
            dependentes: [],
            fotos: [],
            localizacao: null
          });
          Alert.alert('Sucesso', 'Todos os dados foram apagados!');
        }
      }
    ]);
  };

  // Gerar PDF completo
  const gerarPDF = async () => {
    if (!cadastro.nome.trim()) {
      Alert.alert('Erro', 'Preencha o nome do cliente');
      return;
    }

    setLoading(true);

    const dependentesHTML = cadastro.dependentes.map((dep, i) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${i + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${dep.nome || ''}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${dep.parentesco || ''}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${formatDate(dep.nasc)}</td>
      </tr>
    `).join('');

    const fotosHTML = cadastro.fotos.map((foto, i) => `
      <div style="text-align: center; margin-bottom: 20px; page-break-inside: avoid;">
        <img src="${foto}" style="width: 100%; max-width: 300px; border-radius: 8px;" />
        <p style="font-size: 12px; color: #666;">Foto ${i + 1}</p>
      </div>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Helvetica', Arial, sans-serif; padding: 40px; background: #fff; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #C9A84C; padding-bottom: 20px; }
          .header h1 { color: #C9A84C; font-size: 28px; margin-bottom: 5px; }
          .header p { color: #666; font-size: 12px; }
          .section { margin-bottom: 25px; page-break-inside: avoid; }
          .section-title { font-size: 18px; font-weight: bold; color: #000; border-left: 4px solid #C9A84C; padding-left: 10px; margin-bottom: 15px; }
          .info-row { margin-bottom: 8px; }
          .info-label { font-weight: bold; color: #555; display: inline-block; width: 150px; }
          .info-value { color: #333; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .badge-novo { background: rgba(201,168,76,0.15); color: #C9A84C; }
          .badge-port { background: rgba(108,63,197,0.12); color: #6C3FC5; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background-color: #000; color: #fff; padding: 10px; text-align: left; font-size: 12px; }
          td { padding: 8px; border: 1px solid #ddd; font-size: 12px; }
          .fotos-grid { display: flex; flex-wrap: wrap; gap: 15px; margin-top: 15px; }
          .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #ddd; padding-top: 20px; }
          @media print {
            body { padding: 20px; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PAX PREVENIR</h1>
          <p>Sistema de Planos Funerários</p>
          <p style="margin-top: 10px;">Documento gerado em ${new Date().toLocaleString('pt-BR')}</p>
        </div>

        <div class="section">
          <div class="section-title">Tipo de Adesão</div>
          <span class="badge ${cadastro.tipoAdesao === 'Portabilidade' ? 'badge-port' : 'badge-novo'}">${cadastro.tipoAdesao}</span>
          <div class="info-row" style="margin-top: 10px;">
            <span class="info-label">Plano:</span>
            <span class="info-value">${cadastro.plano || 'Não selecionado'}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Dados do Cliente</div>
          <div class="info-row"><span class="info-label">Nome Completo:</span><span class="info-value">${cadastro.nome || ''}</span></div>
          <div class="info-row"><span class="info-label">CPF:</span><span class="info-value">${cadastro.cpf || ''}</span></div>
          <div class="info-row"><span class="info-label">RG:</span><span class="info-value">${cadastro.rg || ''}</span></div>
          <div class="info-row"><span class="info-label">Data de Nascimento:</span><span class="info-value">${formatDate(cadastro.nasc)}</span></div>
          <div class="info-row"><span class="info-label">Telefone:</span><span class="info-value">${cadastro.tel || ''}</span></div>
          <div class="info-row"><span class="info-label">Endereço:</span><span class="info-value">${cadastro.end || ''} ${cadastro.num || ''}</span></div>
          <div class="info-row"><span class="info-label">Bairro:</span><span class="info-value">${cadastro.bairro || ''}</span></div>
          <div class="info-row"><span class="info-label">CEP:</span><span class="info-value">${cadastro.cep || ''}</span></div>
          <div class="info-row"><span class="info-label">Cidade:</span><span class="info-value">${cadastro.cidade || ''}</span></div>
          <div class="info-row"><span class="info-label">Estado Civil:</span><span class="info-value">${cadastro.civil || ''}</span></div>
          <div class="info-row"><span class="info-label">Religião:</span><span class="info-value">${cadastro.rel || ''}</span></div>
          <div class="info-row"><span class="info-label">Ponto de Referência:</span><span class="info-value">${cadastro.ref || ''}</span></div>
        </div>

        <div class="section">
          <div class="section-title">Informações do Plano</div>
          <div class="info-row"><span class="info-label">Valor do Plano:</span><span class="info-value">${cadastro.valor || ''}</span></div>
          <div class="info-row"><span class="info-label">Data de Adesão:</span><span class="info-value">${formatDate(cadastro.dadesao)}</span></div>
          <div class="info-row"><span class="info-label">Data de Vencimento:</span><span class="info-value">${formatDate(cadastro.dvenc)}</span></div>
          <div class="info-row"><span class="info-label">Forma de Pagamento:</span><span class="info-value">${cadastro.pagamento || ''}</span></div>
          <div class="info-row"><span class="info-label">Vendedor:</span><span class="info-value">${cadastro.vendedor || ''}</span></div>
        </div>

        ${cadastro.tipoAdesao === 'Portabilidade' ? `
          <div class="section">
            <div class="section-title">Dados da Portabilidade</div>
            <div class="info-row"><span class="info-label">Empresa de Origem:</span><span class="info-value">${cadastro.empresaOrigem || ''}</span></div>
            <div class="info-row"><span class="info-label">Contrato Anterior:</span><span class="info-value">${cadastro.contratoAnt || ''}</span></div>
            <div class="info-row"><span class="info-label">Tempo no Plano:</span><span class="info-value">${cadastro.tempoAnt || ''}</span></div>
            <div class="info-row"><span class="info-label">Motivo:</span><span class="info-value">${cadastro.motivoPort || ''}</span></div>
          </div>
        ` : ''}

        ${cadastro.dependentes.length > 0 ? `
          <div class="section">
            <div class="section-title">Dependentes (${cadastro.dependentes.length})</div>
            <table>
              <thead>
                <tr><th>#</th><th>Nome</th><th>Parentesco</th><th>Nascimento</th></tr>
              </thead>
              <tbody>${dependentesHTML}</tbody>
            </table>
          </div>
        ` : ''}

        <div class="section">
          <div class="section-title">Localização da Residência</div>
          ${cadastro.localizacao ? `
            <div class="info-row"><span class="info-label">Latitude:</span><span class="info-value">${cadastro.localizacao.lat}</span></div>
            <div class="info-row"><span class="info-label">Longitude:</span><span class="info-value">${cadastro.localizacao.lng}</span></div>
            <div class="info-row"><span class="info-label">Google Maps:</span><span class="info-value">https://maps.google.com/?q=${cadastro.localizacao.lat},${cadastro.localizacao.lng}</span></div>
          ` : '<p style="color: #999;">Localização não capturada para este cadastro.</p>'}
        </div>

        ${cadastro.fotos.length > 0 ? `
          <div class="section">
            <div class="section-title">Fotos da Residência (${cadastro.fotos.length})</div>
            <div class="fotos-grid">${fotosHTML}</div>
          </div>
        ` : ''}

        <div class="footer">
          <p>PAX PREVENIR © ${new Date().getFullYear()} - Sistema de Planos Funerários</p>
          <p>Documento gerado eletronicamente - Versão 1.0</p>
        </div>
      </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
      Alert.alert('Sucesso', 'PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      Alert.alert('Erro', 'Não foi possível gerar o PDF');
    } finally {
      setLoading(false);
    }
  };

  // Estatísticas
  const pagas = adesoes.filter(a => a.status === 'paga').length;
  const pendentes = adesoes.filter(a => a.status === 'pendente').length;
  const baixadas = adesoes.filter(a => a.status === 'baixada').length;

  const filteredAdesoes = adesoes.filter(ad => 
    ad.nome.toLowerCase().includes(searchText.toLowerCase())
  );

  // Menu lateral
  const MenuDrawer = () => (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: menuOpen ? 100 : -1 }} onStartShouldSetResponder={() => true}>
      <View style={{ width: 280, backgroundColor: colors.navy, height: '100%', paddingTop: 50 }}>
        <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 20 }}>🕊️</Text>
            </View>
            <View>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>PAX PREVENIR</Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Sistema Premium</Text>
            </View>
          </View>
        </View>

        <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(201,168,76,0.2)', borderWidth: 2, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 16 }}>👔</Text>
          </View>
          <View>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }}>{cadastro.vendedor || 'Vendedor'}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>Consultor de Planos</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 13, paddingHorizontal: 20, backgroundColor: currentPage === 'cadastro' ? 'rgba(201,168,76,0.12)' : 'transparent', borderLeftWidth: 3, borderLeftColor: currentPage === 'cadastro' ? colors.gold : 'transparent' }}
          onPress={() => { setCurrentPage('cadastro'); setMenuOpen(false); }}
        >
          <Text style={{ fontSize: 18 }}>📋</Text>
          <Text style={{ color: currentPage === 'cadastro' ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '500' }}>Cadastro de Plano</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 13, paddingHorizontal: 20, backgroundColor: currentPage === 'adesoes' ? 'rgba(201,168,76,0.12)' : 'transparent', borderLeftWidth: 3, borderLeftColor: currentPage === 'adesoes' ? colors.gold : 'transparent' }}
          onPress={() => { setCurrentPage('adesoes'); setMenuOpen(false); }}
        >
          <Text style={{ fontSize: 18 }}>📊</Text>
          <Text style={{ color: currentPage === 'adesoes' ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '500' }}>Controle de Adesões</Text>
          {pendentes > 0 && (
            <View style={{ marginLeft: 'auto', backgroundColor: colors.red, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 }}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{pendentes}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 13, paddingHorizontal: 20, backgroundColor: currentPage === 'config' ? 'rgba(201,168,76,0.12)' : 'transparent', borderLeftWidth: 3, borderLeftColor: currentPage === 'config' ? colors.gold : 'transparent' }}
          onPress={() => { setCurrentPage('config'); setMenuOpen(false); }}
        >
          <Text style={{ fontSize: 18 }}>⚙️</Text>
          <Text style={{ color: currentPage === 'config' ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '500' }}>Configurações</Text>
        </TouchableOpacity>

        <View style={{ marginTop: 'auto', padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' }}>
          <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>v1.0 · PAX PREVENIR</Text>
        </View>
      </View>
    </View>
  );

  // Componentes reutilizáveis
  const FormField = ({ label, icon, value, onChange, placeholder, keyboardType = 'default' }) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.gray5, marginBottom: 6 }}>{label}</Text>
      <TextInput
        style={{ backgroundColor: colors.gray1, borderWidth: 1.5, borderColor: colors.gray2, borderRadius: 8, padding: 11, fontSize: 14, color: colors.gray5 }}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.gray3}
        keyboardType={keyboardType}
      />
    </View>
  );

  const PlanCard = ({ name, color, icon, desc }) => (
    <TouchableOpacity
      style={{ flex: 1, backgroundColor: colors.white, borderRadius: 14, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: cadastro.plano === name ? color : 'transparent', marginHorizontal: 6 }}
      onPress={() => setCadastro(prev => ({ ...prev, plano: name }))}
    >
      {cadastro.plano === name && (
        <View style={{ position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 11 }}>✓</Text>
        </View>
      )}
      <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: `${color}20`, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 22 }}>{icon}</Text>
      </View>
      <Text style={{ fontSize: 16, fontWeight: '700', color }}>{name}</Text>
      <Text style={{ fontSize: 11, color: colors.gray4, marginTop: 4, textAlign: 'center' }}>{desc}</Text>
    </TouchableOpacity>
  );

  const TipoCard = ({ name, icon, desc, badge, color, badgeColor }) => (
    <TouchableOpacity
      style={{ flex: 1, backgroundColor: colors.white, borderRadius: 14, padding: 22, alignItems: 'center', borderWidth: 2, borderColor: cadastro.tipoAdesao === name ? color : 'transparent', marginHorizontal: 6 }}
      onPress={() => setCadastro(prev => ({ ...prev, tipoAdesao: name }))}
    >
      {cadastro.tipoAdesao === name && (
        <View style={{ position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 11 }}>✓</Text>
        </View>
      )}
      <View style={{ width: 54, height: 54, borderRadius: 16, backgroundColor: `${color}20`, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 24 }}>{icon}</Text>
      </View>
      <Text style={{ fontSize: 15, fontWeight: '700', color }}>{name}</Text>
      <Text style={{ fontSize: 11, color: colors.gray4, marginTop: 4, textAlign: 'center' }}>{desc}</Text>
      <View style={{ marginTop: 8, backgroundColor: badgeColor, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 }}>
        <Text style={{ fontSize: 10, fontWeight: '700', color: color === colors.gold ? '#8a6b10' : colors.purple }}>{badge}</Text>
      </View>
    </TouchableOpacity>
  );

  // Renderização da página atual
  const renderPage = () => {
    switch (currentPage) {
      case 'cadastro':
        return (
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, padding: 16, paddingBottom: 100 }}>
            {/* Logo Card */}
            <View style={{ backgroundColor: colors.navy, borderRadius: 20, padding: 32, marginBottom: 24, alignItems: 'center', overflow: 'hidden' }}>
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(201,168,76,0.15)', borderWidth: 2, borderColor: 'rgba(201,168,76,0.4)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 30 }}>🕊️</Text>
              </View>
              <Text style={{ color: '#fff', fontSize: 28, fontWeight: '700' }}>PAX <Text style={{ color: colors.gold2 }}>PREVENIR</Text></Text>
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 6 }}>Sistema de Planos Funerários</Text>
            </View>

            {/* Tipo de Adesão */}
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.navy, marginBottom: 16 }}>Tipo de Adesão</Text>
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              <TipoCard name="Plano Novo" icon="📄" desc="Contratação nova do zero" badge="NOVO CLIENTE" color={colors.gold} badgeColor="rgba(201,168,76,0.15)" />
              <TipoCard name="Portabilidade" icon="🔄" desc="Migração de plano" badge="TRANSFERÊNCIA" color={colors.purple} badgeColor="rgba(108,63,197,0.12)" />
            </View>

            {/* Portabilidade Extra */}
            {cadastro.tipoAdesao === 'Portabilidade' && (
              <View style={{ backgroundColor: colors.white, borderRadius: 14, padding: 20, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: colors.purple }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.purple, marginBottom: 12 }}>🏢 Informações da Portabilidade</Text>
                <FormField label="Empresa de Origem" value={cadastro.empresaOrigem} onChange={text => setCadastro(prev => ({ ...prev, empresaOrigem: text }))} placeholder="Nome da empresa anterior" />
                <FormField label="Nº do Contrato Anterior" value={cadastro.contratoAnt} onChange={text => setCadastro(prev => ({ ...prev, contratoAnt: text }))} placeholder="Ex: 00123456" />
                <FormField label="Tempo no Plano Anterior" value={cadastro.tempoAnt} onChange={text => setCadastro(prev => ({ ...prev, tempoAnt: text }))} placeholder="Ex: 2 anos" />
                <FormField label="Motivo da Portabilidade" value={cadastro.motivoPort} onChange={text => setCadastro(prev => ({ ...prev, motivoPort: text }))} placeholder="Ex: Melhor cobertura" />
              </View>
            )}

            {/* Planos */}
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.navy, marginVertical: 16 }}>Selecione o Plano</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
              <View style={{ width: '50%', paddingHorizontal: 6 }}>
                <PlanCard name="Rubi" color="#C0392B" icon="💎" desc="Cobertura Essencial" />
              </View>
              <View style={{ width: '50%', paddingHorizontal: 6 }}>
                <PlanCard name="Esmeralda" color={colors.green} icon="🍃" desc="Cobertura Completa" />
              </View>
              <View style={{ width: '50%', paddingHorizontal: 6, marginTop: 12 }}>
                <PlanCard name="Ouro" color={colors.gold} icon="👑" desc="Cobertura Premium" />
              </View>
              <View style={{ width: '50%', paddingHorizontal: 6, marginTop: 12 }}>
                <PlanCard name="Nacional" color={colors.navy} icon="🇧🇷" desc="Cobertura Nacional" />
              </View>
            </View>

            {/* Dados do Cliente */}
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.navy, marginVertical: 16 }}>Dados do Cliente</Text>
            <View style={{ backgroundColor: colors.white, borderRadius: 14, padding: 20, marginBottom: 8 }}>
              <FormField label="Nome Completo *" value={cadastro.nome} onChange={text => setCadastro(prev => ({ ...prev, nome: text }))} placeholder="Nome completo do titular" />
              <FormField label="Data de Nascimento" value={cadastro.nasc} onChange={text => setCadastro(prev => ({ ...prev, nasc: text }))} placeholder="AAAA-MM-DD" />
              <FormField label="CPF" value={cadastro.cpf} onChange={text => setCadastro(prev => ({ ...prev, cpf: formatCPF(text) }))} placeholder="000.000.000-00" />
              <FormField label="RG" value={cadastro.rg} onChange={text => setCadastro(prev => ({ ...prev, rg: text }))} placeholder="00.000.000-0" />
              <FormField label="Telefone" value={cadastro.tel} onChange={text => setCadastro(prev => ({ ...prev, tel: formatPhone(text) }))} placeholder="(00) 00000-0000" />
              <FormField label="Endereço" value={cadastro.end} onChange={text => setCadastro(prev => ({ ...prev, end: text }))} placeholder="Rua, Avenida..." />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <FormField label="Número" value={cadastro.num} onChange={text => setCadastro(prev => ({ ...prev, num: text }))} placeholder="Nº" />
                </View>
                <View style={{ flex: 2 }}>
                  <FormField label="Bairro" value={cadastro.bairro} onChange={text => setCadastro(prev => ({ ...prev, bairro: text }))} placeholder="Bairro" />
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <FormField label="CEP" value={cadastro.cep} onChange={text => setCadastro(prev => ({ ...prev, cep: text }))} placeholder="00000-000" />
                </View>
                <View style={{ flex: 2 }}>
                  <FormField label="Cidade" value={cadastro.cidade} onChange={text => setCadastro(prev => ({ ...prev, cidade: text }))} placeholder="Cidade" />
                </View>
              </View>
              <FormField label="Ponto de Referência" value={cadastro.ref} onChange={text => setCadastro(prev => ({ ...prev, ref: text }))} placeholder="Próximo a..." />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <FormField label="Estado Civil" value={cadastro.civil} onChange={text => setCadastro(prev => ({ ...prev, civil: text }))} placeholder="Solteiro(a), Casado(a)..." />
                </View>
                <View style={{ flex: 1 }}>
                  <FormField label="Religião" value={cadastro.rel} onChange={text => setCadastro(prev => ({ ...prev, rel: text }))} placeholder="Religião" />
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <FormField label="Data de Adesão" value={cadastro.dadesao} onChange={text => setCadastro(prev => ({ ...prev, dadesao: text }))} placeholder="AAAA-MM-DD" />
                </View>
                <View style={{ flex: 1 }}>
                  <FormField label="Data de Vencimento" value={cadastro.dvenc} onChange={text => setCadastro(prev => ({ ...prev, dvenc: text }))} placeholder="AAAA-MM-DD" />
                </View>
              </View>
              <FormField label="Valor do Plano" value={cadastro.valor} onChange={text => setCadastro(prev => ({ ...prev, valor: formatMoney(text) }))} placeholder="R$ 0,00" />
              <FormField label="Nome do Vendedor" value={cadastro.vendedor} onChange={text => setCadastro(prev => ({ ...prev, vendedor: text }))} placeholder="Seu nome" />
            </View>

            {/* Pagamento */}
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.navy, marginVertical: 16 }}>Forma de Pagamento</Text>
            <View style={{ backgroundColor: colors.white, borderRadius: 14, padding: 20, marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {['Banco', 'Residência', 'Escritório'].map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={{ flex: 1, alignItems: 'center', padding: 14, borderRadius: 8, borderWidth: 2, borderColor: cadastro.pagamento === opt ? colors.navy : colors.gray2, backgroundColor: cadastro.pagamento === opt ? 'rgba(15,32,68,0.06)' : colors.gray1 }}
                    onPress={() => setCadastro(prev => ({ ...prev, pagamento: opt }))}
                  >
                    <Text style={{ fontSize: 22 }}>{opt === 'Banco' ? '🏦' : opt === 'Residência' ? '🏠' : '🏢'}</Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.gray5, marginTop: 8 }}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Dependentes */}
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.navy, marginVertical: 16 }}>Dependentes</Text>
            <View style={{ marginBottom: 8 }}>
              {cadastro.dependentes.map((dep, idx) => (
                <View key={idx} style={{ backgroundColor: colors.white, borderRadius: 14, padding: 16, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: colors.navy3 }}>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: colors.gold2, fontSize: 12, fontWeight: '700' }}>{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <TextInput
                        style={{ backgroundColor: colors.gray1, borderWidth: 1, borderColor: colors.gray2, borderRadius: 8, padding: 10, fontSize: 14, marginBottom: 8 }}
                        value={dep.nome}
                        onChangeText={text => updateDependente(idx, 'nome', text)}
                        placeholder="Nome completo"
                      />
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TextInput
                          style={{ flex: 1, backgroundColor: colors.gray1, borderWidth: 1, borderColor: colors.gray2, borderRadius: 8, padding: 10, fontSize: 14 }}
                          value={dep.parentesco}
                          onChangeText={text => updateDependente(idx, 'parentesco', text)}
                          placeholder="Parentesco"
                        />
                        <TextInput
                          style={{ flex: 1, backgroundColor: colors.gray1, borderWidth: 1, borderColor: colors.gray2, borderRadius: 8, padding: 10, fontSize: 14 }}
                          value={dep.nasc}
                          onChangeText={text => updateDependente(idx, 'nasc', text)}
                          placeholder="Nascimento"
                        />
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => removeDependente(idx)} style={{ width: 30, height: 30, borderRadius: 6, backgroundColor: 'rgba(192,57,43,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 14, color: colors.red }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <TouchableOpacity onPress={addDependente} style={{ padding: 13, borderRadius: 8, borderWidth: 2, borderColor: colors.navy3, borderStyle: 'dashed', backgroundColor: 'rgba(15,32,68,0.06)', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                <Text style={{ fontSize: 14 }}>➕</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.navy }}>Adicionar Dependente</Text>
              </TouchableOpacity>
            </View>

            {/* Fotos */}
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.navy, marginVertical: 16 }}>Fotos da Residência</Text>
            <View style={{ backgroundColor: colors.white, borderRadius: 14, padding: 20, marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                <TouchableOpacity onPress={takePhoto} style={{ flex: 1, padding: 14, borderRadius: 8, backgroundColor: colors.navy, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 14, color: '#fff' }}>📷</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Câmera</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={pickImage} style={{ flex: 1, padding: 14, borderRadius: 8, backgroundColor: colors.gray2, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 14, color: colors.gray5 }}>🖼️</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.gray5 }}>Galeria</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {cadastro.fotos.length === 0 ? (
                  <View style={{ width: '100%', alignItems: 'center', padding: 30 }}>
                    <Text style={{ fontSize: 36, color: colors.gray4, opacity: 0.4 }}>📷</Text>
                    <Text style={{ fontSize: 13, color: colors.gray4, marginTop: 8 }}>Nenhuma foto adicionada</Text>
                  </View>
                ) : (
                  cadastro.fotos.map((foto, idx) => (
                    <View key={idx} style={{ width: (screenWidth - 80) / 3, aspectRatio: 1, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.gray2 }}>
                      <Image source={{ uri: foto }} style={{ width: '100%', height: '100%' }} />
                      <TouchableOpacity onPress={() => removeFoto(idx)} style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(192,57,43,0.85)', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 11, color: '#fff' }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            </View>

            {/* Localização */}
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.navy, marginVertical: 16 }}>Localização da Residência</Text>
            <View style={{ backgroundColor: colors.white, borderRadius: 14, padding: 20, marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, backgroundColor: colors.gray1, borderRadius: 8, marginBottom: 14 }}>
                <Text style={{ fontSize: 28 }}>📍</Text>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: cadastro.localizacao ? colors.green : colors.gray5 }}>{cadastro.localizacao ? 'Localização capturada!' : 'Localização não capturada'}</Text>
                  <Text style={{ fontSize: 12, color: colors.gray4 }}>{cadastro.localizacao ? 'GPS obtido com sucesso' : 'Clique para capturar o GPS'}</Text>
                </View>
              </View>
              {cadastro.localizacao && (
                <View style={{ backgroundColor: colors.green3, borderRadius: 8, padding: 14, marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 12, color: colors.green, fontWeight: '600' }}>Latitude</Text>
                    <Text style={{ fontSize: 13, color: colors.gray5, fontWeight: '500' }}>{cadastro.localizacao.lat}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 12, color: colors.green, fontWeight: '600' }}>Longitude</Text>
                    <Text style={{ fontSize: 13, color: colors.gray5, fontWeight: '500' }}>{cadastro.localizacao.lng}</Text>
                  </View>
                </View>
              )}
              <TouchableOpacity onPress={captureGPS} style={{ padding: 15, borderRadius: 8, backgroundColor: colors.navy, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
                <Text style={{ fontSize: 15, color: '#fff' }}>🎯</Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>Capturar Localização Atual</Text>
              </TouchableOpacity>
            </View>

            {/* Botões Finais */}
            <View style={{ gap: 10, marginTop: 8, paddingBottom: 24 }}>
              <TouchableOpacity onPress={gerarPDF} style={{ padding: 16, borderRadius: 8, backgroundColor: colors.navy, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
                <Text style={{ fontSize: 16, color: '#fff' }}>📄</Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>Gerar PDF Profissional</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={salvarAdesao} style={{ padding: 14, borderRadius: 8, borderWidth: 2, borderColor: colors.navy3, backgroundColor: colors.white, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                <Text style={{ fontSize: 14, color: colors.navy }}>💾</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.navy }}>Salvar Adesão</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={clearForm} style={{ padding: 14, borderRadius: 8, borderWidth: 2, borderColor: 'rgba(192,57,43,0.2)', backgroundColor: 'rgba(192,57,43,0.08)', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                <Text style={{ fontSize: 14, color: colors.red }}>🗑️</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.red }}>Limpar Formulário</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        );

      case 'adesoes':
        return (
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, padding: 16 }}>
            {/* Estatísticas */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              <View style={{ flex: 1, backgroundColor: colors.white, borderRadius: 14, padding: 14, alignItems: 'center' }}>
                <Text style={{ fontSize: 20 }}>✅</Text>
                <Text style={{ fontSize: 26, fontWeight: '700', color: colors.green, marginTop: 4 }}>{pagas}</Text>
                <Text style={{ fontSize: 10, fontWeight: '600', color: colors.gray4 }}>Pagas</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.white, borderRadius: 14, padding: 14, alignItems: 'center' }}>
                <Text style={{ fontSize: 20 }}>⏰</Text>
                <Text style={{ fontSize: 26, fontWeight: '700', color: colors.orange, marginTop: 4 }}>{pendentes}</Text>
                <Text style={{ fontSize: 10, fontWeight: '600', color: colors.gray4 }}>Pendentes</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.white, borderRadius: 14, padding: 14, alignItems: 'center' }}>
                <Text style={{ fontSize: 20 }}>✓✓</Text>
                <Text style={{ fontSize: 26, fontWeight: '700', color: colors.navy3, marginTop: 4 }}>{baixadas}</Text>
                <Text style={{ fontSize: 10, fontWeight: '600', color: colors.gray4 }}>Baixadas</Text>
              </View>
            </View>

            {/* Busca */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ position: 'relative' }}>
                <Text style={{ position: 'absolute', left: 14, top: 16, zIndex: 1, fontSize: 15, color: colors.gray4 }}>🔍</Text>
                <TextInput
                  style={{ backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.gray2, borderRadius: 8, padding: 12, paddingLeft: 40, fontSize: 14, color: colors.gray5 }}
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholder="Pesquisar por nome..."
                  placeholderTextColor={colors.gray3}
                />
              </View>
            </View>

            {/* Lista de Adesões Pagas */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ backgroundColor: 'rgba(45,125,90,0.1)', padding: 12, borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                <Text style={{ color: colors.green, fontSize: 13, fontWeight: '700' }}>✅ Pagas na Hora</Text>
              </View>
              {filteredAdesoes.filter(a => a.status === 'paga').length === 0 ? (
                <View style={{ backgroundColor: colors.white, padding: 24, alignItems: 'center', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
                  <Text style={{ fontSize: 28, color: colors.gray4, opacity: 0.35 }}>📭</Text>
                  <Text style={{ fontSize: 13, color: colors.gray4, marginTop: 6 }}>Nenhuma adesão paga na hora</Text>
                </View>
              ) : (
                filteredAdesoes.filter(a => a.status === 'paga').map(ad => (
                  <View key={ad.id} style={{ backgroundColor: colors.white, padding: 14, borderTopWidth: 1, borderTopColor: colors.gray2, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.gray5 }}>{ad.nome}</Text>
                      <Text style={{ fontSize: 12, color: colors.gray4, marginTop: 2 }}>
                        {ad.vendedor && <Text>👔 {ad.vendedor}  </Text>}
                        {ad.venc && <Text>📅 {formatDate(ad.venc)}</Text>}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.navy }}>{ad.valor}</Text>
                    <TouchableOpacity onPress={() => deleteAdesao(ad.id)} style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: 'rgba(192,57,43,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 12, color: colors.red }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            {/* Lista de Pendentes */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ backgroundColor: 'rgba(230,126,34,0.1)', padding: 12, borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                <Text style={{ color: colors.orange, fontSize: 13, fontWeight: '700' }}>⏰ Futuras Pendentes</Text>
              </View>
              {filteredAdesoes.filter(a => a.status === 'pendente').length === 0 ? (
                <View style={{ backgroundColor: colors.white, padding: 24, alignItems: 'center', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
                  <Text style={{ fontSize: 28, color: colors.gray4, opacity: 0.35 }}>📭</Text>
                  <Text style={{ fontSize: 13, color: colors.gray4, marginTop: 6 }}>Nenhuma adesão pendente</Text>
                </View>
              ) : (
                filteredAdesoes.filter(a => a.status === 'pendente').map(ad => (
                  <View key={ad.id} style={{ backgroundColor: colors.white, padding: 14, borderTopWidth: 1, borderTopColor: colors.gray2, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.gray5 }}>{ad.nome}</Text>
                      <Text style={{ fontSize: 12, color: colors.gray4, marginTop: 2 }}>
                        {ad.vendedor && <Text>👔 {ad.vendedor}  </Text>}
                        {ad.venc && <Text>📅 {formatDate(ad.venc)}</Text>}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.navy }}>{ad.valor}</Text>
                    <TouchableOpacity onPress={() => darBaixa(ad.id)} style={{ padding: 7, borderRadius: 8, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 11, color: '#fff' }}>✓</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteAdesao(ad.id)} style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: 'rgba(192,57,43,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 12, color: colors.red }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            {/* Lista de Baixadas */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ backgroundColor: 'rgba(36,63,122,0.08)', padding: 12, borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                <Text style={{ color: colors.navy3, fontSize: 13, fontWeight: '700' }}>💳 Pagas Após Baixa</Text>
              </View>
              {filteredAdesoes.filter(a => a.status === 'baixada').length === 0 ? (
                <View style={{ backgroundColor: colors.white, padding: 24, alignItems: 'center', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
                  <Text style={{ fontSize: 28, color: colors.gray4, opacity: 0.35 }}>📭</Text>
                  <Text style={{ fontSize: 13, color: colors.gray4, marginTop: 6 }}>Nenhuma baixa registrada</Text>
                </View>
              ) : (
                filteredAdesoes.filter(a => a.status === 'baixada').map(ad => (
                  <View key={ad.id} style={{ backgroundColor: colors.white, padding: 14, borderTopWidth: 1, borderTopColor: colors.gray2, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.gray5 }}>{ad.nome}</Text>
                      <Text style={{ fontSize: 12, color: colors.gray4, marginTop: 2 }}>
                        {ad.vendedor && <Text>👔 {ad.vendedor}  </Text>}
                        {ad.venc && <Text>📅 {formatDate(ad.venc)}</Text>}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.navy }}>{ad.valor}</Text>
                    <TouchableOpacity onPress={() => deleteAdesao(ad.id)} style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: 'rgba(192,57,43,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 12, color: colors.red }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        );

      case 'config':
        return (
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, padding: 16 }}>
            <View style={{ backgroundColor: colors.white, borderRadius: 14, padding: 22, marginBottom: 16 }}>
              <Text style={{ fontSize: 28, color: colors.navy3 }}>🏢</Text>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.navy, marginVertical: 16 }}>Empresa</Text>
              <FormField label="Nome da Empresa" value={config.empresa} onChange={text => { setConfig(prev => ({ ...prev, empresa: text })); AsyncStorage.setItem('pax_config', JSON.stringify({ ...config, empresa: text })); }} placeholder="PAX PREVENIR" />
              <FormField label="Vendedor Padrão" value={config.vendedor} onChange={text => { setConfig(prev => ({ ...prev, vendedor: text })); AsyncStorage.setItem('pax_config', JSON.stringify({ ...config, vendedor: text })); }} placeholder="Seu nome completo" />
              <FormField label="Cidade / Estado" value={config.cidade} onChange={text => { setConfig(prev => ({ ...prev, cidade: text })); AsyncStorage.setItem('pax_config', JSON.stringify({ ...config, cidade: text })); }} placeholder="Ex: Aracaju / SE" />
            </View>

            <View style={{ backgroundColor: colors.white, borderRadius: 14, padding: 22, marginBottom: 16 }}>
              <Text style={{ fontSize: 28, color: colors.navy3 }}>📱</Text>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.navy, marginVertical: 16 }}>PWA / Aplicativo</Text>
              <View style={{ backgroundColor: colors.gray1, borderRadius: 8, padding: 14 }}>
                <Text style={{ fontSize: 13, color: colors.gray5, lineHeight: 20 }}>O sistema funciona 100% offline após a primeira abertura.</Text>
              </View>
            </View>

            <View style={{ backgroundColor: colors.white, borderRadius: 14, padding: 22, borderWidth: 1.5, borderColor: 'rgba(192,57,43,0.2)', marginBottom: 16 }}>
              <Text style={{ fontSize: 28, color: colors.red }}>⚠️</Text>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.red, marginVertical: 16 }}>Zona de Perigo</Text>
              <Text style={{ fontSize: 13, color: colors.gray4, marginBottom: 16, lineHeight: 20 }}>Esta ação apaga todos os dados salvos no dispositivo. Não pode ser desfeita.</Text>
              <TouchableOpacity onPress={deleteAllData} style={{ padding: 14, borderRadius: 8, borderWidth: 2, borderColor: 'rgba(192,57,43,0.2)', backgroundColor: 'rgba(192,57,43,0.08)', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                <Text style={{ fontSize: 14, color: colors.red }}>🗑️</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.red }}>Apagar Todos os Dados</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.gray1 }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />
      
      {/* Topbar */}
      <View style={{ height: 60, backgroundColor: colors.navy, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 }}>
        <TouchableOpacity onPress={() => setMenuOpen(true)} style={{ padding: 8 }}>
          <View style={{ width: 22, gap: 5 }}>
            <View style={{ height: 2, backgroundColor: colors.gold2, borderRadius: 2 }} />
            <View style={{ height: 2, backgroundColor: colors.gold2, borderRadius: 2 }} />
            <View style={{ height: 2, backgroundColor: colors.gold2, borderRadius: 2 }} />
          </View>
        </TouchableOpacity>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ fontSize: 20, color: colors.gold2 }}>🕊️</Text>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.white }}>PAX <Text style={{ color: colors.gold2 }}>PREVENIR</Text></Text>
        </View>
        {currentPage === 'cadastro' && (
          <TouchableOpacity onPress={gerarPDF} style={{ backgroundColor: colors.gold, borderRadius: 8, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 13, color: colors.navy }}>📄</Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.navy }}>PDF</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Menu Drawer */}
      {menuOpen && (
        <TouchableOpacity 
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100 }}
          onPress={() => setMenuOpen(false)}
          activeOpacity={1}
        >
          <View style={{ width: 280, backgroundColor: colors.navy, height: '100%', paddingTop: 50 }}>
            <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 20 }}>🕊️</Text>
                </View>
                <View>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>PAX PREVENIR</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Sistema Premium</Text>
                </View>
              </View>
            </View>

            <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(201,168,76,0.2)', borderWidth: 2, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 16 }}>👔</Text>
              </View>
              <View>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }}>{cadastro.vendedor || 'Vendedor'}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>Consultor de Planos</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 13, paddingHorizontal: 20, backgroundColor: currentPage === 'cadastro' ? 'rgba(201,168,76,0.12)' : 'transparent', borderLeftWidth: 3, borderLeftColor: currentPage === 'cadastro' ? colors.gold : 'transparent' }}
              onPress={() => { setCurrentPage('cadastro'); setMenuOpen(false); }}
            >
              <Text style={{ fontSize: 18 }}>📋</Text>
              <Text style={{ color: currentPage === 'cadastro' ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '500' }}>Cadastro de Plano</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 13, paddingHorizontal: 20, backgroundColor: currentPage === 'adesoes' ? 'rgba(201,168,76,0.12)' : 'transparent', borderLeftWidth: 3, borderLeftColor: currentPage === 'adesoes' ? colors.gold : 'transparent' }}
              onPress={() => { setCurrentPage('adesoes'); setMenuOpen(false); }}
            >
              <Text style={{ fontSize: 18 }}>📊</Text>
              <Text style={{ color: currentPage === 'adesoes' ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '500' }}>Controle de Adesões</Text>
              {pendentes > 0 && (
                <View style={{ marginLeft: 'auto', backgroundColor: colors.red, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{pendentes}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 13, paddingHorizontal: 20, backgroundColor: currentPage === 'config' ? 'rgba(201,168,76,0.12)' : 'transparent', borderLeftWidth: 3, borderLeftColor: currentPage === 'config' ? colors.gold : 'transparent' }}
              onPress={() => { setCurrentPage('config'); setMenuOpen(false); }}
            >
              <Text style={{ fontSize: 18 }}>⚙️</Text>
              <Text style={{ color: currentPage === 'config' ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '500' }}>Configurações</Text>
            </TouchableOpacity>

            <View style={{ marginTop: 'auto', padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' }}>
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>v1.0 · PAX PREVENIR</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Loading */}
      {loading && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={{ color: '#fff', marginTop: 20, fontSize: 14 }}>Processando...</Text>
        </View>
      )}

      {/* Conteúdo principal */}
      {renderPage()}
    </SafeAreaView>
  );
}
