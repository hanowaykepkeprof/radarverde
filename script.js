// Inicializa mapa centrado em Caseara/TO
var map = L.map('map').setView([-9.2749, -49.9528], 11);

// Camada base: imagens de satélite Esri
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye'
}).addTo(map);

// // Lista de riscos
// var riscos = [
//   {cor:'#2ecc71', texto:'Baixo', textoColor:'green'},
//   {cor:'#f1c40f', texto:'Médio', textoColor:'#b7950b'},
//   {cor:'#e67e22', texto:'Alto', textoColor:'#e67e22'},
//   {cor:'#e74c3c', texto:'Crítico', textoColor:'red'}
// ];

// // Áreas fictícias dentro do parque
// var areas = [
//   {
//     nome: 'Área Norte',
//     coords: [
//       [-9.20,-49.99],
//       [-9.20,-49.93],
//       [-9.25,-49.93],
//       [-9.25,-49.99]
//     ],
//     riscoIndex: 0
//   },
//   {
//     nome: 'Área Central',
//     coords: [
//       [-9.28,-49.98],
//       [-9.28,-49.94],
//       [-9.33,-49.94],
//       [-9.33,-49.98]
//     ],
//     riscoIndex: 2
//   },
//   {
//     nome: 'Área Sul',
//     coords: [
//       [-9.35,-49.97],
//       [-9.35,-49.93],
//       [-9.40,-49.93],
//       [-9.40,-49.97]
//     ],
//     riscoIndex: 3
//   }
// ];

// // Criar polígonos
// areas.forEach((a,i)=>{
//   a.poly = L.polygon(a.coords, {
//     color:riscos[a.riscoIndex].cor,
//     fillColor:riscos[a.riscoIndex].cor,
//     fillOpacity:0.5
//   }).addTo(map)
//     .bindPopup(a.nome+' - Risco '+riscos[a.riscoIndex].texto);
// });

// // Criar controles (botões) para cada área
// var areaControlsDiv = document.getElementById('areaControls');
// areas.forEach((a,i)=>{
//   var btn = document.createElement('button');
//   btn.className = 'btn text-white';
//   btn.textContent = 'Trocar Risco - '+a.nome+' (atual: '+riscos[a.riscoIndex].texto+')';
//   btn.style.backgroundColor = riscos[a.riscoIndex].cor;
//   btn.onclick = function(){
//     // Avança risco dessa área
//     a.riscoIndex = (a.riscoIndex + 1) % riscos.length;
//     a.poly.setStyle({color:riscos[a.riscoIndex].cor, fillColor:riscos[a.riscoIndex].cor});
//     a.poly.bindPopup(a.nome+' - Risco '+riscos[a.riscoIndex].texto);
//     btn.textContent = 'Trocar Risco - '+a.nome+' (atual: '+riscos[a.riscoIndex].texto+')';
//     btn.style.backgroundColor = riscos[a.riscoIndex].cor;
//   };
//   areaControlsDiv.appendChild(btn);
// });

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

  // Alterna as classes de coluna do Bootstrap para o mapa ocupar a tela inteira
  mapContainer.classList.toggle('col-lg-8', !isHidden);
  mapContainer.classList.toggle('col-md-7', !isHidden);
  mapContainer.classList.toggle('col-12', !isHidden); // Adicionado para telas pequenas
  mapContainer.classList.toggle('col-lg-12', isHidden);
  mapContainer.classList.toggle('col-md-12', isHidden);
  mapContainer.classList.toggle('col-12', isHidden); // Adicionado para telas pequenas

  // Ajusta a altura do mapa em telas móveis
  if (window.innerWidth < 768) {
    mapContainer.style.height = isHidden ? '100vh' : '50vh';
  }

  // Força o mapa a se redimensionar para o novo tamanho do contêiner
  // O timeout garante que a transição do DOM foi concluída antes de redimensionar o mapa
  setTimeout(() => {
    map.invalidateSize();
  }, 150);
});

  // === Nova parte: Carregar focos reais do INPE (GeoJSON) ===
  // Substitua a URL abaixo pela URL GeoJSON real que você gerar no BDQueimadas/Terrabrasilis
  var urlFocos = 'queimadas_consolidadas_2015-2024.geojson';

  fetch(urlFocos)
    .then(response => response.json())
    .then(data => {
      // Adiciona os focos como pontos
      L.geoJSON(data, {
        pointToLayer: function(feature, latlng) {
          return L.circleMarker(latlng, {
            radius: 5,
            color: '#ff0000',
            fillColor: '#ff6600',
            fillOpacity: 0.7
          });
        },
        onEachFeature: function(feature, layer) {
        
          var props = feature.properties;
          //console.log(props);
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

      // --- Início da Lógica dos Gráficos ---

      // 1. Processar e agrupar os dados
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
          acc[chave] = {
            RiscoFogo: [],
            Precipitacao: [],
            DiaSemChuva: [],
          };
        }

        acc[chave].RiscoFogo.push(props.RiscoFogo);
        acc[chave].Precipitacao.push(props.Precipitacao);
        acc[chave].DiaSemChuva.push(props.DiaSemChuva);

        return acc;
      }, {});

      // 2. Calcular as médias e preparar os dados para os gráficos
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

      // 3. Função auxiliar para criar gráficos
      function criarGrafico(ctx, titulo, datasets, options = {}) {
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: datasets
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'top' },
              title: { display: true, text: titulo }
            },
            scales: {
              x: { title: { display: true, text: 'Mês/Ano' } }
            },
            ...options,
          }
        });
      }

      // 4. Criar os gráficos
      criarGrafico(
        document.getElementById('graficoDiaSemChuva').getContext('2d'),
        'Média de Dias Sem Chuva por Mês',
        [{ label: 'Dias Sem Chuva', data: avgDiaSemChuva, borderColor: '#ffc107', backgroundColor: '#ffc10780', fill: true }]
      );

      criarGrafico(
        document.getElementById('graficoPrecipitacao').getContext('2d'),
        'Média de Precipitação (mm) por Mês',
        [{ label: 'Precipitação (mm)', data: avgPrecipitacao, borderColor: '#0d6efd', backgroundColor: '#0d6efd80', fill: true }]
      );

      criarGrafico(
        document.getElementById('graficoRiscoFogo').getContext('2d'),
        'Média de Risco de Fogo por Mês',
        [{ label: 'Risco de Fogo', data: avgRiscoFogo, borderColor: '#dc3545', backgroundColor: '#dc354580', fill: true }]
      );

      criarGrafico(
        document.getElementById('graficoChuvaPrecipitacao').getContext('2d'),
        'Dias Sem Chuva vs. Precipitação',
        [
          { label: 'Dias Sem Chuva', data: avgDiaSemChuva, borderColor: '#ffc107', yAxisID: 'y' },
          { label: 'Precipitação (mm)', data: avgPrecipitacao, borderColor: '#0d6efd', yAxisID: 'y1' }
        ],
        { scales: { y: { position: 'left', title: {display: true, text: 'Dias'} }, y1: { position: 'right', title: {display: true, text: 'mm'}, grid: { drawOnChartArea: false } } } }
      );

      criarGrafico(
        document.getElementById('graficoCompleto').getContext('2d'),
        'Análise Completa de Queimadas',
        [
          { label: 'Risco de Fogo', data: avgRiscoFogo, borderColor: '#dc3545' },
          { label: 'Precipitação (mm)', data: avgPrecipitacao, borderColor: '#0d6efd' },
          { label: 'Dias Sem Chuva', data: avgDiaSemChuva, borderColor: '#ffc107' }
        ]
      );
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

  // Camada para os novos pontos adicionados pelo usuário
  const novosPontosLayer = L.geoJSON(null, {
    pointToLayer: (feature, latlng) => {
      return L.marker(latlng, {
        icon: L.icon({ // Ícone customizado para diferenciar
            iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        })
      });
    },
    onEachFeature: function(feature, layer) {
      const props = feature.properties;
      const info = `<b>Data/Hora:</b> ${props.DataHora}<br>
                    <b>Dias S/ Chuva:</b> ${props.DiaSemChuva}<br>
                    <b>Precipitação:</b> ${props.Precipitacao} mm<br>
                    <b>Risco de Fogo:</b> ${props.RiscoFogo}`;
      layer.bindPopup(info);
    }
  }).addTo(map);

  // Carrega pontos salvos do localStorage ao iniciar
  let pontosSalvos = JSON.parse(localStorage.getItem('novosPontos')) || [];
  if (pontosSalvos.length > 0) {
    novosPontosLayer.addData({ type: 'FeatureCollection', features: pontosSalvos });
  }

  // Obter localização do usuário
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

  // Salvar novo ponto
  formNovoPonto.addEventListener('submit', (e) => {
    e.preventDefault();

    const novoPonto = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(lonInput.value), parseFloat(latInput.value)]
      },
      properties: {
        DataHora: new Date(document.getElementById('datahora').value).toISOString(),
        DiaSemChuva: parseInt(document.getElementById('diasemchuva').value),
        Precipitacao: parseFloat(document.getElementById('precipitacao').value),
        RiscoFogo: parseFloat(document.getElementById('riscofogo').value)
      }
    };

    // Adiciona à camada do mapa
    novosPontosLayer.addData(novoPonto);

    // Salva no array e no localStorage
    pontosSalvos.push(novoPonto);
    localStorage.setItem('novosPontos', JSON.stringify(pontosSalvos));

    alert('Ponto salvo com sucesso!');
    formNovoPonto.reset();
  });

  // Baixar pontos salvos
  btnBaixarPontos.addEventListener('click', () => {
    if (pontosSalvos.length === 0) {
      alert('Nenhum ponto salvo para baixar.');
      return;
    }

    const dataStr = JSON.stringify({
      type: 'FeatureCollection',
      features: pontosSalvos
    }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/geo+json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pontos_personalizados_${new Date().toISOString().slice(0,10)}.geojson`;
    link.click();
    URL.revokeObjectURL(url);
  });
