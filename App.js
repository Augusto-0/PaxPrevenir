import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
  Dimensions,
  Image,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

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
  gray1: '#f8f9fb',
  gray2: '#eef0f4',
  gray3: '#d1d5de',
  gray4: '#8a91a0',
  gray5: '#4a5168',
  white: '#ffffff'
};

export default function App() {
  const [paginaAtual, setPaginaAtual] = useState('cadastro');
  const [menuAberto, setMenuAberto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pesquisaTexto, setPesquisaTexto] = useState('');
  
  // Estado do Cadastro
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
  const [tipoAdesaoRapida, setTipoAdesaoRapida] = useState('hora');

  // Carregar dados ao iniciar
  useEffect(() => {
    carregarTudo();
  }, []);

  const carregarTudo = async () => {
    setLoading(true);
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
      
      // Pedir permissões
      await Location.requestForegroundPermissionsAsync();
      await ImagePicker.requestCameraPermissionsAsync();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      
    } catch (error) {
      console.error('Erro ao carregar:', error);
    } finally {
      setLoading(false);
    }
  };

  const salvarCadastro = async () => {
    try {
      await AsyncStorage.setItem('pax_cadastro', JSON.stringify(cadastro));
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  useEffect(() => {
    salvarCadastro();
  }, [cadastro]);

  // Formatações
  const formatarCPF = (texto) => {
    let v = texto.replace(/\D/g, '');
    if (v.length > 3) v = v.slice(0, 3) + '.' + v.slice(3);
    if (v.length > 7) v = v.slice(0, 7) + '.' + v.slice(7);
    if (v.length > 11) v = v.slice(0, 11) + '-' + v.slice(11);
    return v.slice(0, 14);
  };

  const formatarTelefone = (texto) => {
    let v = texto.replace(/\D/g, '');
    if (v.length > 0) v = '(' + v;
    if (v.length > 3) v = v.slice(0, 3) + ') ' + v.slice(3);
    if (v.length > 10) v = v.slice(0, 10) + '-' + v.slice(10);
    return v.slice(0, 15);
  };

  const formatarDinheiro = (texto) => {
    let v = texto.replace(/\D/g, '');
    if (!v) return '';
    const num = (parseInt(v) / 100).toFixed(2);
    return 'R$ ' + num.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const formatarData = (data) => {
    if (!data) return '';
    const [y, m, d] = data.split('-');
    return `${d}/${m}/${y}`;
  };

  // GPS
  const capturarGPS = async () => {
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
      Alert.alert('Erro', 'Não foi possível capturar a localização');
    } finally {
      setLoading(false);
    }
  };

  // Fotos
  const tirarFoto = async () => {
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

  const escolherImagem = async () => {
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

  const removerFoto = (index) => {
    setCadastro(prev => ({
      ...prev,
      fotos: prev.fotos.filter((_, i) => i !== index)
    }));
  };

  // Dependentes
  const adicionarDependente = () => {
    setCadastro(prev => ({
      ...prev,
      dependentes: [...prev.dependentes, { nome: '', parentesco: '', nasc: '' }]
    }));
  };

  const atualizarDependente = (index, campo, valor) => {
    const novosDeps = [...cadastro.dependentes];
    novosDeps[index][campo] = valor;
    setCadastro(prev => ({ ...prev, dependentes: novosDeps }));
  };

  const removerDependente = (index) => {
    setCadastro(prev => ({
      ...prev,
      dependentes: prev.dependentes.filter((_, i) => i !== index)
    }));
  };

  // Adesões
  const adicionarAdesao = () => {
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
      tipo: tipoAdesaoRapida,
      status: tipoAdesaoRapida === 'hora' ? 'paga' : 'pendente',
      dataCriacao: new Date().toISOString()
    };
    
    const novasAdesoes = [novaAdesao, ...adesoes];
    setAdesoes(novasAdesoes);
    AsyncStorage.setItem('pax_adesoes', JSON.stringify(novasAdesoes));
    Alert.alert('Sucesso', 'Adesão registrada!');
  };

  const darBaixa = (id) => {
    Alert.alert('Dar Baixa', 'Confirmar pagamento?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: () => {
          const novasAdesoes = adesoes.map(ad => 
            ad.id === id ? { ...ad, status: 'baixada', dataBaixa: new Date().toISOString() } : ad
          );
          setAdesoes(novasAdesoes);
          AsyncStorage.setItem('pax_adesoes', JSON.stringify(novasAdesoes));
          Alert.alert('Sucesso', 'Baixa registrada!');
        }
      }
    ]);
  };

  const excluirAdesao = (id) => {
    Alert.alert('Excluir', 'Confirmar exclusão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          const novasAdesoes = adesoes.filter(ad => ad.id !== id);
          setAdesoes(novasAdesoes);
          AsyncStorage.setItem('pax_adesoes', JSON.stringify(novasAdesoes));
        }
      }
    ]);
  };

  const salvarAdesaoControle = () => {
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
    
    const novasAdesoes = [novaAdesao, ...adesoes];
    setAdesoes(novasAdesoes);
    AsyncStorage.setItem('pax_adesoes', JSON.stringify(novasAdesoes));
    Alert.alert('Sucesso', 'Adesão salva!');
  };

  // Gerar PDF
  const gerarPDF = async () => {
    if (!cadastro.nome.trim()) {
      Alert.alert('Erro', 'Preencha o nome do cliente');
      return;
    }

    setLoading(true);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #C9A84C; text-align: center; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 18px; font-weight: bold; border-bottom: 2px solid #C9A84C; margin-bottom: 10px; }
          .info { margin: 5px 0; }
          .label { font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>PAX PREVENIR</h1>
        <p style="text-align: center;">Sistema de Planos Funerários</p>
        
        <div class="section">
          <div class="section-title">Dados do Cliente</div>
          <div class="info"><span class="label">Nome:</span> ${cadastro.nome || ''}</div>
          <div class="info"><span class="label">CPF:</span> ${cadastro.cpf || ''}</div>
          <div class="info"><span class="label">Telefone:</span> ${cadastro.tel || ''}</div>
          <div class="info"><span class="label">Endereço:</span> ${cadastro.end || ''} ${cadastro.num || ''}</div>
          <div class="info"><span class="label">Cidade:</span> ${cadastro.cidade || ''}</div>
        </div>
        
        <div class="section">
          <div class="section-title">Plano</div>
          <div class="info"><span class="label">Plano:</span> ${cadastro.plano || 'Não selecionado'}</div>
          <div class="info"><span class="label">Valor:</span> ${cadastro.valor || ''}</div>
          <div class="info"><span class="label">Vendedor:</span> ${cadastro.vendedor || ''}</div>
        </div>
        
        <p style="text-align: center; margin-top: 40px;">Documento gerado em ${new Date().toLocaleString('pt-BR')}</p>
      </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
      Alert.alert('Sucesso', 'PDF gerado!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível gerar o PDF');
    } finally {
      setLoading(false);
    }
  };

  const limparFormulario = () => {
    Alert.alert('Limpar Formulário', 'Todos os dados serão apagados?', [
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

  const apagarTudo = () => {
    Alert.alert('Apagar Todos os Dados', 'ATENÇÃO: Ação irreversível!', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
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

  // Estatísticas
  const pagas = adesoes.filter(a => a.status === 'paga').length;
  const pendentes = adesoes.filter(a => a.status === 'pendente').length;
  const baixadas = adesoes.filter(a => a.status === 'baixada').length;

  const adesoesFiltradas = adesoes.filter(ad => 
    ad.nome.toLowerCase().includes(pesquisaTexto.toLowerCase())
  );

  // Componente de campo de formulário
  const CampoFormulario = ({ label, valor, onChange, placeholder, teclado = 'default' }) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.gray5, marginBottom: 6 }}>{label}</Text>
      <TextInput
        style={{ backgroundColor: colors.gray1, borderWidth: 1.5, borderColor: colors.gray2, borderRadius: 8, padding: 11, fontSize: 14, color: colors.gray5 }}
        value={valor}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.gray3}
        keyboardType={teclado}
      />
    </View>
  );

  // Tela de Cadastro
  const TelaCadastro = () => (
    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, padding: 16, paddingBottom: 100 }}>
      {/* Logo */}
      <View style={{ backgroundColor: colors.navy, borderRadius: 20, padding: 32, marginBottom: 24, alignItems: 'center' }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(201,168,76,0.15)', borderWidth: 2, borderColor: 'rgba(201,168,76,0.4)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 30 }}>🕊️</Text>
        </View>
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '700' }}>PAX <Text style={{ color: colors.gold2 }}>PREVENIR</Text></Text>
        <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 6 }}>Sistema de Planos Funerários</Text>
      </View>

      {/* Tipo de Adesão */}
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.navy, marginBottom: 16 }}>Tipo de Adesão</Text>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: colors.white, borderRadius: 14, padding: 22, alignItems: 'center', borderWidth: 2, borderColor: cadastro.tipoAdesao === 'Plano Novo' ? colors.gold : 'transparent' }}
          onPress={() => setCadastro(prev => ({ ...prev, tipoAdesao: 'Plano Novo' }))}
        >
          <Text style={{ fontSize: 24 }}>📄</Text>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.gold }}>Plano Novo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: colors.white, borderRadius: 14, padding: 22, alignItems: 'center', borderWidth: 2, borderColor: cadastro.tipoAdesao === 'Portabilidade' ? colors.purple : 'transparent' }}
          onPress={() => setCadastro(prev => ({ ...prev, tipoAdesao: 'Portabilidade' }))}
        >
          <Text style={{ fontSize: 24 }}>🔄</Text>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.purple }}>Portabilidade</Text>
        </TouchableOpacity>
      </View>

      {/* Planos */}
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.navy, marginVertical: 16 }}>Selecione o Plano</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: colors.white, borderRadius: 14, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: cadastro.plano === 'Rubi' ? '#C0392B' : 'transparent' }}
          onPress={() => setCadastro(prev => ({ ...prev, plano: 'Rubi' }))}
        >
          <Text style={{ fontSize: 22 }}>💎</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#C0392B' }}>Rubi</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: colors.white, borderRadius: 14, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: cadastro.plano === 'Esmeralda' ? colors.green : 'transparent' }}
          onPress={() => setCadastro(prev => ({ ...prev, plano: 'Esmeralda' }))}
        >
          <Text style={{ fontSize: 22 }}>🍃</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.green }}>Esmeralda</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: colors.white, borderRadius: 14, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: cadastro.plano === 'Ouro' ? colors.gold : 'transparent' }}
          onPress={() => setCadastro(prev => ({ ...prev, plano: 'Ouro' }))}
        >
          <Text style={{ fontSize: 22 }}>👑</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.gold }}>Ouro</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: colors.white, borderRadius: 14, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: cadastro.plano === 'Nacional' ? colors.navy : 'transparent' }}
          onPress={() => setCadastro(prev => ({ ...prev, plano: 'Nacional' }))}
        >
          <Text style={{ fontSize: 22 }}>🇧🇷</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.navy }}>Nacional</Text>
        </TouchableOpacity>
      </View>

      {/* Dados do Cliente */}
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.navy, marginVertical: 16 }}>Dados do Cliente</Text>
      <View style={{ backgroundColor: colors.white, borderRadius: 14, padding: 20, marginBottom: 8 }}>
        <CampoFormulario label="Nome Completo *" valor={cadastro.nome} onChange={text => setCadastro(prev => ({ ...prev, nome: text }))} placeholder="Nome completo" />
        <CampoFormulario label="Data de Nascimento" valor={cadastro.nasc} onChange={text => setCadastro(prev => ({ ...prev, nasc: text }))} placeholder="AAAA-MM-DD" />
        <CampoFormulario label="CPF" valor={cadastro.cpf} onChange={text => setCadastro(prev => ({ ...prev, cpf: formatarCPF(text) }))} placeholder="000.000.000-00" />
        <CampoFormulario label="RG" valor={cadastro.rg} onChange={text => setCadastro(prev => ({ ...prev, rg: text }))} placeholder="00.000.000-0" />
        <CampoFormulario label="Telefone" valor={cadastro.tel} onChange={text => setCadastro(prev => ({ ...prev, tel: formatarTelefone(text) }))} placeholder="(00) 00000-0000" />
        <CampoFormulario label="Endereço" valor={cadastro.end} onChange={text => setCadastro(prev => ({ ...prev, end: text }))} placeholder="Rua, Avenida..." />
        
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <CampoFormulario label="Número" valor={cadastro.num} onChange={text => setCadastro(prev => ({ ...prev, num: text }))} placeholder="Nº" />
          </View>
          <View style={{ flex: 2 }}>
            <CampoFormulario label="Bairro" valor={cadastro.bairro} onChange={text => setCadastro(prev => ({ ...prev, bairro: text }))} placeholder="Bairro" />
          </View>
        </View>
        
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <CampoFormulario label="CEP" valor={cadastro.cep} onChange={text => setCadastro(prev => ({ ...prev, cep: text }))} placeholder="00000-000" />
          </View>
          <View style={{ flex: 2 }}>
            <CampoFormulario label="Cidade" valor={cadastro.cidade} onChange={text => setCadastro(prev => ({ ...prev, cidade: text }))} placeholder="Cidade" />
          </View>
        </View>
        
        <CampoFormulario label="Estado Civil" valor={cadastro.civil} onChange={text => setCadastro(prev => ({ ...prev, civil: text }))} placeholder="Solteiro(a), Casado(a)..." />
        <CampoFormulario label="Religião" valor={cadastro.rel} onChange={text => setCadastro(prev => ({ ...prev, rel: text }))} placeholder="Religião" />
        <CampoFormulario label="Valor do Plano" valor={cadastro.valor} onChange={text => setCadastro(prev => ({ ...prev, valor: formatarDinheiro(text) }))} placeholder="R$ 0,00" />
        <CampoFormulario label="Nome do Vendedor" valor={cadastro.vendedor} onChange={text => setCadastro(prev => ({ ...prev, vendedor: text }))} placeholder="Seu nome" />
      </View>

      {/* GPS */}
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.navy, marginVertical: 16 }}>Localização</Text>
      <View style={{ backgroundColor: colors.white, borderRadius: 14, padding: 20, marginBottom: 8 }}>
        <TouchableOpacity onPress={capturarGPS} style={{ padding: 15, borderRadius: 8, backgroundColor: colors.navy, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
          <Text style={{ fontSize: 18 }}>📍</Text>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>Capturar Localização</Text>
        </TouchableOpacity>
        {cadastro.localizacao && (
          <View style={{ marginTop: 15, padding: 10, backgroundColor: colors.green3, borderRadius: 8 }}>
            <Text>Lat: {cadastro.localizacao.lat}</Text>
            <Text>Lng: {cadastro.localizacao.lng}</Text>
          </View>
        )}
      </View>

      {/* Fotos */}
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.navy, marginVertical: 16 }}>Fotos</Text>
      <View style={{ backgroundColor: colors.white, borderRadius: 14, padding: 20, marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <TouchableOpacity onPress={tirarFoto} style={{ flex: 1, padding: 14, borderRadius: 8, backgroundColor: colors.navy, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            <Text style={{ fontSize: 14, color: '#fff' }}>📷</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Câmera</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={escolherImagem} style={{ flex: 1, padding: 14, borderRadius: 8, backgroundColor: colors.gray2, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            <Text style={{ fontSize: 14, color: colors.gray5 }}>🖼️</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.gray5 }}>Galeria</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {cadastro.fotos.length === 0 ? (
            <View style={{ width: '100%', alignItems: 'center', padding: 30 }}>
              <Text style={{ fontSize: 36, color: colors.gray4 }}>📷</Text>
              <Text style={{ fontSize: 13, color: colors.gray4 }}>Nenhuma foto</Text>
            </View>
          ) : (
            cadastro.fotos.map((foto, idx) => (
              <View key={idx} style={{ width: (width - 80) / 3, aspectRatio: 1, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.gray2 }}>
                <Image source={{ uri: foto }} style={{ width: '100%', height: '100%' }} />
                <TouchableOpacity onPress={() => removerFoto(idx)} style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(192,57,43,0.85)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 11, color: '#fff' }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </View>

      {/* Botões */}
      <View style={{ gap: 10, marginTop: 8, paddingBottom: 24 }}>
        <TouchableOpacity onPress={gerarPDF} style={{ padding: 16, borderRadius: 8, backgroundColor: colors.navy, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
          <Text style={{ fontSize: 16, color: '#fff' }}>📄</Text>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>Gerar PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={salvarAdesaoControle} style={{ padding: 14, borderRadius: 8, borderWidth: 2, borderColor: colors.navy3, backgroundColor: colors.white, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          <Text style={{ fontSize: 14, color: colors.navy }}>💾</Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.navy }}>Salvar Adesão</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={limparFormulario} style={{ padding: 14, borderRadius: 8, borderWidth: 2, borderColor: 'rgba(192,57,43,0.2)', backgroundColor: 'rgba(192,57,43,0.08)', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          <Text style={{ fontSize: 14, color: colors.red }}>🗑️</Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.red }}>Limpar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Tela de Adesões
  const TelaAdesoes = () => (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      {/* Estatísticas */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        <View style={{ flex: 1, backgroundColor: colors.white, borderRadius: 14, padding: 14, alignItems: 'center' }}>
          <Text style={{ fontSize: 20 }}>✅</Text>
          <Text style={{ fontSize: 26, fontWeight: '700', color: colors.green }}>{pagas}</Text>
          <Text style={{ fontSize: 10 }}>Pagas</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.white, borderRadius: 14, padding: 14, alignItems: 'center' }}>
          <Text style={{ fontSize: 20 }}>⏰</Text>
          <Text style={{ fontSize: 26, fontWeight: '700', color: colors.orange }}>{pendentes}</Text>
          <Text style={{ fontSize: 10 }}>Pendentes</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.white, borderRadius: 14, padding: 14, alignItems: 'center' }}>
          <Text style={{ fontSize: 20 }}>✓✓</Text>
          <Text style={{ fontSize: 26, fontWeight: '700', color: colors.navy3 }}>{baixadas}</Text>
          <Text style={{ fontSize: 10 }}>Baixadas</Text>
        </View>
      </View>

      {/* Busca */}
      <TextInput
        style={{ backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.gray2, borderRadius: 8, padding: 12, paddingLeft: 40, fontSize: 14, marginBottom: 20 }}
        value={pesquisaTexto}
        onChangeText={setPesquisaTexto}
        placeholder="🔍 Pesquisar..."
      />

      {/* Adesões Pagas */}
      <View style={{ marginBottom: 20 }}>
        <View style={{ backgroundColor: 'rgba(45,125,90,0.1)', padding: 12, borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
          <Text style={{ color: colors.green }}>✅ Pagas na Hora</Text>
        </View>
        {adesoesFiltradas.filter(a => a.status === 'paga').map(ad => (
          <View key={ad.id} style={{ backgroundColor: colors.white, padding: 14, borderTopWidth: 1, borderTopColor: colors.gray2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View><Text style={{ fontWeight: 'bold' }}>{ad.nome}</Text><Text style={{ fontSize: 12, color: colors.gray4 }}>{ad.valor}</Text></View>
            <TouchableOpacity onPress={() => excluirAdesao(ad.id)} style={{ padding: 8, borderRadius: 6, backgroundColor: 'rgba(192,57,43,0.08)' }}><Text style={{ color: colors.red }}>🗑️</Text></TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Adesões Pendentes */}
      <View style={{ marginBottom: 20 }}>
        <View style={{ backgroundColor: 'rgba(230,126,34,0.1)', padding: 12, borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
          <Text style={{ color: colors.orange }}>⏰ Pendentes</Text>
        </View>
        {adesoesFiltradas.filter(a => a.status === 'pendente').map(ad => (
          <View key={ad.id} style={{ backgroundColor: colors.white, padding: 14, borderTopWidth: 1, borderTopColor: colors.gray2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View><Text style={{ fontWeight: 'bold' }}>{ad.nome}</Text><Text style={{ fontSize: 12, color: colors.gray4 }}>{ad.valor}</Text></View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => darBaixa(ad.id)} style={{ padding: 8, borderRadius: 6, backgroundColor: colors.green }}><Text style={{ color: '#fff' }}>✓</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => excluirAdesao(ad.id)} style={{ padding: 8, borderRadius: 6, backgroundColor: 'rgba(192,57,43,0.08)' }}><Text style={{ color: colors.red }}>🗑️</Text></TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  // Tela de Configurações
  const TelaConfig = () => (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <View style={{ backgroundColor: colors.white, borderRadius: 14, padding: 22, marginBottom: 16 }}>
        <Text style={{ fontSize: 28 }}>🏢</Text>
        <Text style={{ fontSize: 18, fontWeight: '600', marginVertical: 16 }}>Empresa</Text>
        <CampoFormulario label="Nome" valor={config.empresa} onChange={text => setConfig(prev => ({ ...prev, empresa: text }))} />
        <CampoFormulario label="Vendedor Padrão" valor={config.vendedor} onChange={text => setConfig(prev => ({ ...prev, vendedor: text }))} />
      </View>
      
      <TouchableOpacity onPress={apagarTudo} style={{ padding: 14, borderRadius: 8, borderWidth: 2, borderColor: 'rgba(192,57,43,0.2)', backgroundColor: 'rgba(192,57,43,0.08)', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
        <Text style={{ fontSize: 14, color: colors.red }}>🗑️</Text>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.red }}>Apagar Todos os Dados</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.navy }}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={{ color: '#fff', marginTop: 20 }}>Carregando...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.gray1 }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />
      
      {/* Topbar */}
      <View style={{ height: 60, backgroundColor: colors.navy, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
        <TouchableOpacity onPress={() => setMenuAberto(!menuAberto)} style={{ padding: 8 }}>
          <View style={{ width: 22, gap: 5 }}>
            <View style={{ height: 2, backgroundColor: colors.gold2, borderRadius: 2 }} />
            <View style={{ height: 2, backgroundColor: colors.gold2, borderRadius: 2 }} />
            <View style={{ height: 2, backgroundColor: colors.gold2, borderRadius: 2 }} />
          </View>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.white }}>PAX <Text style={{ color: colors.gold2 }}>PREVENIR</Text></Text>
        </View>
        {paginaAtual === 'cadastro' && (
          <TouchableOpacity onPress={gerarPDF} style={{ backgroundColor: colors.gold, borderRadius: 8, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 13, color: colors.navy }}>📄</Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.navy }}>PDF</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Menu Lateral */}
      {menuAberto && (
        <TouchableOpacity style={{ position: 'absolute', top: 60, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100 }} onPress={() => setMenuAberto(false)} activeOpacity={1}>
          <View style={{ width: 280, backgroundColor: colors.navy, height: '100%', paddingTop: 20 }}>
            <TouchableOpacity style={{ padding: 15, backgroundColor: paginaAtual === 'cadastro' ? 'rgba(201,168,76,0.12)' : 'transparent' }} onPress={() => { setPaginaAtual('cadastro'); setMenuAberto(false); }}>
              <Text style={{ color: '#fff', fontSize: 16 }}>📋 Cadastro</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ padding: 15, backgroundColor: paginaAtual === 'adesoes' ? 'rgba(201,168,76,0.12)' : 'transparent' }} onPress={() => { setPaginaAtual('adesoes'); setMenuAberto(false); }}>
              <Text style={{ color: '#fff', fontSize: 16 }}>📊 Adesões</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ padding: 15, backgroundColor: paginaAtual === 'config' ? 'rgba(201,168,76,0.12)' : 'transparent' }} onPress={() => { setPaginaAtual('config'); setMenuAberto(false); }}>
              <Text style={{ color: '#fff', fontSize: 16 }}>⚙️ Config</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {/* Conteúdo */}
      {paginaAtual === 'cadastro' && TelaCadastro()}
      {paginaAtual === 'adesoes' && TelaAdesoes()}
      {paginaAtual === 'config' && TelaConfig()}
    </SafeAreaView>
  );
}
