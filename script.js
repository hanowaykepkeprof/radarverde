// Inicializa mapa centrado em Caseara/TO
var map = L.map('map').setView([-9.2749, -49.9528], 11);

// Camada base: imagens de satélite Esri
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye'
}).addTo(map);

// Lista de riscos
var riscos = [
  {cor:'#2ecc71', texto:'Baixo', textoColor:'green'},
  {cor:'#f1c40f', texto:'Médio', textoColor:'#b7950b'},
  {cor:'#e67e22', texto:'Alto', textoColor:'#e67e22'},
  {cor:'#e74c3c', texto:'Crítico', textoColor:'red'}
];

// Áreas fictícias dentro do parque
var areas = [
  {
    nome: 'Área Norte',
    coords: [
      [-9.20,-49.99],
      [-9.20,-49.93],
      [-9.25,-49.93],
      [-9.25,-49.99]
    ],
    riscoIndex: 0
  },
  {
    nome: 'Área Central',
    coords: [
      [-9.28,-49.98],
      [-9.28,-49.94],
      [-9.33,-49.94],
      [-9.33,-49.98]
    ],
    riscoIndex: 2
  },
  {
    nome: 'Área Sul',
    coords: [
      [-9.35,-49.97],
      [-9.35,-49.93],
      [-9.40,-49.93],
      [-9.40,-49.97]
    ],
    riscoIndex: 3
  }
];

// Criar polígonos
areas.forEach((a,i)=>{
  a.poly = L.polygon(a.coords, {
    color:riscos[a.riscoIndex].cor,
    fillColor:riscos[a.riscoIndex].cor,
    fillOpacity:0.5
  }).addTo(map)
    .bindPopup(a.nome+' - Risco '+riscos[a.riscoIndex].texto);
});

// Criar controles (botões) para cada área
var areaControlsDiv = document.getElementById('areaControls');
areas.forEach((a,i)=>{
  var btn = document.createElement('button');
  btn.className = 'btn text-white';
  btn.textContent = 'Trocar Risco - '+a.nome+' (atual: '+riscos[a.riscoIndex].texto+')';
  btn.style.backgroundColor = riscos[a.riscoIndex].cor;
  btn.onclick = function(){
    // Avança risco dessa área
    a.riscoIndex = (a.riscoIndex + 1) % riscos.length;
    a.poly.setStyle({color:riscos[a.riscoIndex].cor, fillColor:riscos[a.riscoIndex].cor});
    a.poly.bindPopup(a.nome+' - Risco '+riscos[a.riscoIndex].texto);
    btn.textContent = 'Trocar Risco - '+a.nome+' (atual: '+riscos[a.riscoIndex].texto+')';
    btn.style.backgroundColor = riscos[a.riscoIndex].cor;
  };
  areaControlsDiv.appendChild(btn);
});

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
    })
    .catch(err => {
      console.error('Erro ao carregar focos de calor:', err);
    });
