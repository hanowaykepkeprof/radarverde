// Inicializa mapa centrado em Caseara/TO
var map = L.map('map').setView([-9.2749, -49.9528], 11);

// Camada base: imagens de satélite Esri
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye'
}).addTo(map);

// Gráfico histórico de risco (dados fictícios)
var ctx = document.getElementById('graficoRisco').getContext('2d');
var grafico = new Chart(ctx, {
  type: 'line',
  data: {
    labels: ['Dia -6','Dia -5','Dia -4','Dia -3','Dia -2','Ontem','Hoje'],
    datasets: [{
      label: 'Índice de Risco Médio (0=Baixo / 3=Crítico)',
      data: [1,2,2,3,3,2,3],
      borderColor: '#e74c3c',
      backgroundColor: 'rgba(231,76,60,0.2)',
      fill: true,
      tension: 0.3
    }]
  },
  options: {
    scales: {
      y: {
        min: 0,
        max: 3,
        ticks: {
          stepSize: 1
        }
      }
    }
  }
});

// Lógica para alternar a visibilidade do painel de informações
const toggleBtn = document.getElementById('toggle-info-btn');
const infoAside = document.querySelector('aside');
const mapContainer = document.getElementById('map-container');

// Ajuste inicial para telas móveis
if (window.innerWidth < 768) {
  infoAside.classList.add('d-none');
  mapContainer.style.height = '100vh';
  mapContainer.classList.add('col-12');
  setTimeout(() => map.invalidateSize(), 150);
}

toggleBtn.addEventListener('click', () => {
  const isHidden = infoAside.classList.toggle('d-none');
  mapContainer.classList.toggle('col-lg-8', !isHidden);
  mapContainer.classList.toggle('col-md-7', !isHidden);
  mapContainer.classList.toggle('col-12', !isHidden);
  mapContainer.classList.toggle('col-lg-12', isHidden);
  mapContainer.classList.toggle('col-md-12', isHidden);
  mapContainer.classList.toggle('col-12', isHidden);
  if (window.innerWidth < 768) {
    mapContainer.style.height = isHidden ? '100vh' : '50vh';
  }
  setTimeout(() => {
    map.invalidateSize();
  }, 150);
});

// === Nova parte: Carregar focos reais do INPE (GeoJSON) ===
let geoJsonData = null;
let geoJsonLayer = null;
var urlFocos = 'queimadas_consolidadas_2015-2024.geojson';

fetch(urlFocos)
  .then(response => response.json())
  .then(data => {
    geoJsonData = data;

    function getColorForRisco(risco) {
      if (risco === null || risco === undefined) return '#808080';
      if (risco <= 0.25) return '#2ecc71';
      if (risco <= 0.50) return '#f1c40f';
      if (risco <= 0.75) return '#e67e22';
      return '#e74c3c';
    }

    geoJsonLayer = L.geoJSON(data, {
      pointToLayer: function(feature, latlng) {
        const risco = feature.properties.RiscoFogo;
        const cor = getColorForRisco(risco);
        return L.circleMarker(latlng, {
          radius: 5,
          color: cor,
          fillColor: cor,
          fillOpacity: 0.8,
          weight: 1
        });
      },
      onEachFeature: function(feature, layer) {
        var props = feature.properties;
        var info = '';
        if (props) {
          info = '<b>DataHora:</b> ' + props.DataHora +
                 '<br><b>DiaSemChuva:</b> ' + props.DiaSemChuva +
                 '<br><b>Precipitacao:</b> ' + props.Precipitacao +
                 '<br><b>RiscoFogo:</b> ' + props.RiscoFogo;
        }
        layer.bindPopup((info ? '' + info : ''));
      }
    }).addTo(map);

    inicializarFiltros();

    // --- Início da Lógica dos Gráficos ---
    const dadosAgrupados = data.features.reduce((acc, feature) => {
      const props = feature.properties;
      if (!props.DataHora || props.RiscoFogo === null || props.Precipitacao === null || props.DiaSemChuva === null) {
        return acc;
      }
      const dataHora = new Date(props.DataHora.replace(' ', 'T'));
      if (isNaN(dataHora)) return acc;
      const ano = dataHora.getFullYear();
      const mes = dataHora.getMonth() + 1;
      const chave = `${ano}-${mes.toString().padStart(2, '0')}`;
      if (!acc[chave]) {
        acc[chave] = { RiscoFogo: [], Precipitacao: [], DiaSemChuva: [] };
      }
      acc[chave].RiscoFogo.push(props.RiscoFogo);
      acc[chave].Precipitacao.push(props.Precipitacao);
      acc[chave].DiaSemChuva.push(props.DiaSemChuva);
      return acc;
    }, {});

    const labels = Object.keys(dadosAgrupados).sort();
    const calcularMedia = (chave, propriedade) => {
      const valores = dadosAgrupados[chave][propriedade];
      if (valores.length === 0) return 0;
      const soma = valores.reduce((a, b) => a + b, 0);
      return soma / valores.length;
    };
    const avgRiscoFogo = labels.map(chave => calcularMedia(chave, 'RiscoFogo'));
    const avgPrecipitacao = labels.map(chave => calcularMedia(chave, 'Precipitacao'));
    const avgDiaSemChuva = labels.map(chave => calcularMedia(chave, 'DiaSemChuva'));

    function criarGrafico(ctx, titulo, datasets, options = {}) {
      new Chart(ctx, {
        type: 'line',
        data: { labels: labels, datasets: datasets },
        options: {
          responsive: true,
          plugins: { legend: { position: 'top' }, title: { display: true, text: titulo } },
          scales: { x: { title: { display: true, text: 'Mês/Ano' } } },
          ...options,
        }
      });
    }

    criarGrafico(document.getElementById('graficoDiaSemChuva').getContext('2d'), 'Média de Dias Sem Chuva por Mês', [{ label: 'Dias Sem Chuva', data: avgDiaSemChuva, borderColor: '#ffc107', backgroundColor: '#ffc10780', fill: true }]);
    criarGrafico(document.getElementById('graficoPrecipitacao').getContext('2d'), 'Média de Precipitação (mm) por Mês', [{ label: 'Precipitação (mm)', data: avgPrecipitacao, borderColor: '#0d6efd', backgroundColor: '#0d6efd80', fill: true }]);
    criarGrafico(document.getElementById('graficoRiscoFogo').getContext('2d'), 'Média de Risco de Fogo por Mês', [{ label: 'Risco de Fogo', data: avgRiscoFogo, borderColor: '#dc3545', backgroundColor: '#dc354580', fill: true }]);
    criarGrafico(document.getElementById('graficoChuvaPrecipitacao').getContext('2d'), 'Dias Sem Chuva vs. Precipitação', [{ label: 'Dias Sem Chuva', data: avgDiaSemChuva, borderColor: '#ffc107', yAxisID: 'y' }, { label: 'Precipitação (mm)', data: avgPrecipitacao, borderColor: '#0d6efd', yAxisID: 'y1' }], { scales: { y: { position: 'left', title: {display: true, text: 'Dias'} }, y1: { position: 'right', title: {display: true, text: 'mm'}, grid: { drawOnChartArea: false } } } });
    criarGrafico(document.getElementById('graficoCompleto').getContext('2d'), 'Análise Completa de Queimadas', [{ label: 'Risco de Fogo', data: avgRiscoFogo, borderColor: '#dc3545' }, { label: 'Precipitação (mm)', data: avgPrecipitacao, borderColor: '#0d6efd' }, { label: 'Dias Sem Chuva', data: avgDiaSemChuva, borderColor: '#ffc107' }]);
  })
  .catch(err => {
    console.error('Erro ao carregar focos de calor:', err);
  });

// --- Lógica para Adicionar Novos Pontos ---
const formNovoPonto = document.getElementById('formNovoPonto');
const btnLocalizacao = document.getElementById('btnLocalizacao');
const btnBaixarPontos = document.getElementById('btnBaixarPontos');
const latInput = document.getElementById('latitude');
const lonInput = document.getElementById('longitude');
const novosPontosLayer = L.geoJSON(null, {
  pointToLayer: (feature, latlng) => L.marker(latlng, { icon: L.icon({ iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] }) }),
  onEachFeature: function(feature, layer) {
    const props = feature.properties;
    const info = `<b>Data/Hora:</b> ${props.DataHora}<br><b>Dias S/ Chuva:</b> ${props.DiaSemChuva}<br><b>Precipitação:</b> ${props.Precipitacao} mm<br><b>Risco de Fogo:</b> ${props.RiscoFogo}`;
    layer.bindPopup(info);
  }
}).addTo(map);

let pontosSalvos = JSON.parse(localStorage.getItem('novosPontos')) || [];
if (pontosSalvos.length > 0) {
  novosPontosLayer.addData({ type: 'FeatureCollection', features: pontosSalvos });
}

btnLocalizacao.addEventListener('click', () => {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(position => {
      latInput.value = position.coords.latitude.toFixed(6);
      lonInput.value = position.coords.longitude.toFixed(6);
    }, error => {
      alert('Não foi possível obter a localização. Verifique as permissões do seu navegador.');
      console.error(error);
    });
  } else {
    alert('Geolocalização não é suportada pelo seu navegador.');
  }
});

formNovoPonto.addEventListener('submit', (e) => {
  e.preventDefault();
  const novoPonto = {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [parseFloat(lonInput.value), parseFloat(latInput.value)] },
    properties: {
      DataHora: new Date(document.getElementById('datahora').value).toISOString(),
      DiaSemChuva: parseInt(document.getElementById('diasemchuva').value),
      Precipitacao: parseFloat(document.getElementById('precipitacao').value),
      RiscoFogo: parseFloat(document.getElementById('riscofogo').value)
    }
  };
  novosPontosLayer.addData(novoPonto);
  pontosSalvos.push(novoPonto);
  localStorage.setItem('novosPontos', JSON.stringify(pontosSalvos));
  alert('Ponto salvo com sucesso!');
  formNovoPonto.reset();
});

btnBaixarPontos.addEventListener('click', () => {
  if (pontosSalvos.length === 0) {
    alert('Nenhum ponto salvo para baixar.');
    return;
  }
  const dataStr = JSON.stringify({ type: 'FeatureCollection', features: pontosSalvos }, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/geo+json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pontos_personalizados_${new Date().toISOString().slice(0,10)}.geojson`;
  link.click();
  URL.revokeObjectURL(url);
});

// --- Lógica de Filtros ---
const filtroDataInicio = document.getElementById('filtroDataInicio');
const filtroDataFim = document.getElementById('filtroDataFim');
const filtroPrecipitacao = document.getElementById('filtroPrecipitacao');
const filtroDiasSemChuva = document.getElementById('filtroDiasSemChuva');
const formFiltros = document.getElementById('formFiltros');
const btnLimparFiltros = document.getElementById('btnLimparFiltros');
const precipitacaoValorLabel = document.getElementById('precipitacaoValorLabel');
const diasSemChuvaValorLabel = document.getElementById('diasSemChuvaValorLabel');
const legendaRiscoItems = document.querySelectorAll('#legendaRisco .list-group-item');
let riscoFiltro = null;

function updatePrecipitacaoLabel() { precipitacaoValorLabel.textContent = `Até ${filtroPrecipitacao.value} mm`; }
function updateDiasSemChuvaLabel() { diasSemChuvaValorLabel.textContent = `Até ${filtroDiasSemChuva.value} dias`; }

function aplicarFiltros() {
  if (!geoJsonData || !geoJsonLayer) return;

  const dataInicio = filtroDataInicio.value ? new Date(filtroDataInicio.value + 'T00:00:00') : null;
  const dataFim = filtroDataFim.value ? new Date(filtroDataFim.value + 'T23:59:59') : null;
  const precipitacaoMax = parseInt(filtroPrecipitacao.value, 10);
  const diasSemChuvaMax = parseInt(filtroDiasSemChuva.value, 10);

  const dadosFiltrados = geoJsonData.features.filter(feature => {
    const props = feature.properties;
    const dataPonto = props.DataHora ? new Date(props.DataHora.replace(/\//g, '-').replace(' ', 'T')) : null;
    if (dataInicio && (!dataPonto || dataPonto < dataInicio)) return false;
    if (dataFim && (!dataPonto || dataPonto > dataFim)) return false;
    if (props.Precipitacao === null || props.Precipitacao > precipitacaoMax) return false;
    if (props.DiaSemChuva === null || props.DiaSemChuva > diasSemChuvaMax) return false;

    if (riscoFiltro) {
        const risco = props.RiscoFogo;
        if (riscoFiltro === 'baixo' && (risco > 0.25)) return false;
        if (riscoFiltro === 'medio' && (risco <= 0.25 || risco > 0.50)) return false;
        if (riscoFiltro === 'alto' && (risco <= 0.50 || risco > 0.75)) return false;
        if (riscoFiltro === 'critico' && (risco <= 0.75)) return false;
    }

    return true;
  });

  geoJsonLayer.clearLayers();
  geoJsonLayer.addData({ type: 'FeatureCollection', features: dadosFiltrados });
}

function inicializarFiltros() {
    filtroPrecipitacao.value = filtroPrecipitacao.max;
    filtroDiasSemChuva.value = filtroDiasSemChuva.max;
    updatePrecipitacaoLabel();
    updateDiasSemChuvaLabel();

    filtroDataInicio.addEventListener('change', aplicarFiltros);
    filtroDataFim.addEventListener('change', aplicarFiltros);
    filtroPrecipitacao.addEventListener('input', () => { updatePrecipitacaoLabel(); aplicarFiltros(); });
    filtroDiasSemChuva.addEventListener('input', () => { updateDiasSemChuvaLabel(); aplicarFiltros(); });

    legendaRiscoItems.forEach(item => {
        item.addEventListener('click', () => {
            const riscoSelecionado = item.dataset.risco;

            if (riscoFiltro === riscoSelecionado) {
                riscoFiltro = null;
                item.classList.remove('active');
            } else {
                legendaRiscoItems.forEach(i => i.classList.remove('active'));
                riscoFiltro = riscoSelecionado;
                item.classList.add('active');
            }
            aplicarFiltros();
        });
    });

    btnLimparFiltros.addEventListener('click', (e) => {
        e.preventDefault();
        formFiltros.reset();
        filtroPrecipitacao.value = filtroPrecipitacao.max;
        filtroDiasSemChuva.value = filtroDiasSemChuva.max;
        updatePrecipitacaoLabel();
        updateDiasSemChuvaLabel();

        riscoFiltro = null;
        legendaRiscoItems.forEach(i => i.classList.remove('active'));

        aplicarFiltros();
    });
    aplicarFiltros();
}
