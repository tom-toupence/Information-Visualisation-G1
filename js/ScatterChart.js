// ============================================================================
// SCATTER CHART - Visualisation D3 avec brush
// ============================================================================

class ScatterChart {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        
        // Prendre toute la place disponible du conteneur
        const container = document.getElementById(containerId);
        this.width = container.clientWidth || 1200;
        this.height = container.clientHeight || 650;
        
        // Marges réduites pour maximiser l'espace du graphe
        this.margin = { top: 5, right: 90, bottom: 50, left: 55 };
        this.data = [];
        
        // Dimensions du graphique (plus d'espace disponible)
        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;
    }

    /**
     * Affiche le scatter plot
     * @param {Array} data - Données mappées à visualiser
     */
    visualize(data) {
        this.data = data;
        
        // Supprimer le SVG existant
        d3.select(`#${this.containerId}`).select('svg').remove();

        // Créer le SVG
        const svg = d3.select(`#${this.containerId}`)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height);

        // Groupe principal
        const g = svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        // Échelles
        const xScale = d3.scaleLinear()
            .domain([0, 1])
            .range([0, this.innerWidth])
            .nice();

        const yScale = d3.scaleLinear()
            .domain([0, 1])
            .range([this.innerHeight, 0])
            .nice();

        // Axes
        const xAxis = d3.axisBottom(xScale).ticks(10);
        const yAxis = d3.axisLeft(yScale).ticks(10);

        // Axe X
        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${this.innerHeight})`)
            .call(xAxis)
            .selectAll('text')
            .style('fill', '#e2e2e2');

        // Axe Y
        g.append('g')
            .attr('class', 'y-axis')
            .call(yAxis)
            .selectAll('text')
            .style('fill', '#e2e2e2');
        
        // Style des lignes d'axes
        g.selectAll('.x-axis path, .y-axis path, .x-axis line, .y-axis line')
            .style('stroke', '#535353');

        // Labels
        g.append('text')
            .attr('transform', `translate(${this.innerWidth / 2}, ${this.innerHeight + 45})`)
            .style('text-anchor', 'middle')
            .style('fill', '#e2e2e2')
            .style('font-size', '14px')
            .style('font-weight', '600')
            .text('Danceability →');

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - this.margin.left + 10)
            .attr('x', 0 - (this.innerHeight / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('fill', '#e2e2e2')
            .style('font-size', '14px')
            .style('font-weight', '600')
            .text('← Energy');

        // Ajouter le brush EN PREMIER (il sera en dessous)
        this.addBrush(g, null, xScale, yScale, data);

        // Créer les cercles APRÈS le brush (ils seront au-dessus)
        const circles = g.selectAll('.scatter-dot')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', 'scatter-dot')
            .attr('cx', d => xScale(d.x))
            .attr('cy', d => yScale(d.y))
            .attr('r', 0)
            .attr('fill', d => d.color)  // Coloré directement
            .attr('opacity', 0)
            .attr('stroke', '#222')
            .attr('stroke-width', 0.3)
            .style('pointer-events', 'all');  // Assurer que les événements fonctionnent

        // Animation d'apparition
        circles.transition()
            .duration(500)
            .delay((d, i) => Math.min(i * 0.5, 100))
            .attr('r', d => d.size)
            .attr('opacity', 0.7);  // Plus visible

        // Mettre à jour le brush avec les cercles maintenant qu'ils existent
        this.updateBrushCircles(circles);

        // Ajouter la légende à droite
        this.addPopularityLegend(svg);

        // Ajouter interactivité APRÈS avoir créé les cercles
        this.addTooltip(circles);
        this.addClickDetails(circles, svg);

        console.log(`Visualisation créée avec ${data.length} points`);
    }

    /**
     * Ajoute la légende de popularité à droite du graphique
     * @param {d3.Selection} svg - SVG principal
     */
    addPopularityLegend(svg) {
        const legendWidth = 20;
        const legendHeight = this.innerHeight; // Prend toute la hauteur du graphe
        const legendX = this.width - this.margin.right + 30;
        const legendY = this.margin.top;

        // Créer le dégradé
        const defs = svg.append('defs');
        const linearGradient = defs.append('linearGradient')
            .attr('id', 'popularity-gradient')
            .attr('x1', '0%')
            .attr('y1', '100%')
            .attr('x2', '0%')
            .attr('y2', '0%');

        // Ajouter les stops du dégradé Viridis
        const steps = [0, 25, 50, 75, 100];
        steps.forEach(step => {
            linearGradient.append('stop')
                .attr('offset', `${step}%`)
                .attr('stop-color', d3.interpolateViridis(step / 100));
        });

        const legend = svg.append('g')
            .attr('class', 'popularity-legend')
            .attr('transform', `translate(${legendX}, ${legendY})`);

        // Titre
        legend.append('text')
            .attr('x', 0)
            .attr('y', -20)
            .style('font-size', '13px')
            .style('font-weight', '600')
            .style('fill', '#e2e2e2')
            .text('Popularité');

        // Rectangle avec dégradé
        legend.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .style('fill', 'url(#popularity-gradient)')
            .style('stroke', '#555')
            .style('stroke-width', '1px');

        // Échelle pour les labels
        const legendScale = d3.scaleLinear()
            .domain([0, 100])
            .range([legendHeight, 0]);

        const legendAxis = d3.axisRight(legendScale)
            .ticks(5)
            .tickFormat(d => `${d}`);

        legend.append('g')
            .attr('class', 'legend-axis')
            .attr('transform', `translate(${legendWidth}, 0)`)
            .call(legendAxis)
            .selectAll('text')
            .style('fill', '#e2e2e2')
            .style('font-size', '11px');

        legend.select('.legend-axis .domain')
            .style('stroke', '#555');

        legend.select('.legend-axis').selectAll('.tick line')
            .style('stroke', '#555');
    }

    /**
     * Ajoute le tooltip au survol
     * @param {d3.Selection} circles - Sélection des cercles
     */
    addTooltip(circles) {
        console.log('🎯 Attachement du tooltip sur', circles.size(), 'cercles');
        
        // Supprimer les tooltips existants
        d3.selectAll('.scatter-tooltip').remove();
        
        const tooltip = d3.select('body').append('div')
            .attr('class', 'scatter-tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(0, 0, 0, 0.9)')
            .style('color', 'white')
            .style('padding', '12px')
            .style('border-radius', '6px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('z-index', '10000')
            .style('max-width', '300px');

        circles
            .on('mouseover', (event, d) => {
                console.log('👆 Survol:', d.metadata.track_name);
                d3.select(event.currentTarget)
                    .transition()
                    .duration(100)
                    .attr('r', d.size * 1.5)
                    .attr('opacity', 1);

                tooltip.transition()
                    .duration(200)
                    .style('opacity', 1);

                tooltip.html(`
                    <div style="font-weight: 600; margin-bottom: 6px; color: ${d.color};">
                        ${d.metadata.track_name}
                    </div>
                    <div style="font-size: 11px; color: #ccc; margin-bottom: 8px;">
                        ${d.metadata.artist_name}
                    </div>
                    <div style="font-size: 11px; line-height: 1.6;">
                        <div>Popularity: <strong>${d.metadata.popularity}</strong>/100</div>
                        <div>Danceability: <strong>${(d.metadata.danceability * 100).toFixed(0)}%</strong></div>
                        <div>Energy: <strong>${(d.metadata.energy * 100).toFixed(0)}%</strong></div>
                        ${d.metadata.valence !== undefined ? `<div>Valence: <strong>${(d.metadata.valence * 100).toFixed(0)}%</strong></div>` : ''}
                        ${d.metadata.tempo !== undefined ? `<div>Tempo: <strong>${d.metadata.tempo.toFixed(0)} BPM</strong></div>` : ''}
                    </div>
                `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', (event, d) => {
                d3.select(event.currentTarget)
                    .transition()
                    .duration(100)
                    .attr('r', d.size)
                    .attr('opacity', 0.7);

                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });
    }

    /**
     * Ajoute l'interaction au clic pour afficher les détails
     * @param {d3.Selection} circles - Sélection des cercles
     * @param {d3.Selection} svg - SVG principal
     */
    addClickDetails(circles, svg) {
        // Créer le panneau de détails (caché par défaut) - Stocké dans this.detailsPanel
        this.detailsPanel = d3.select('body')
            .append('div')
            .attr('class', 'details-panel')
            .style('position', 'fixed')
            .style('bottom', '20px')
            .style('left', '50%')
            .style('transform', 'translateX(-50%)')
            .style('background', 'rgba(43, 47, 66, 0.98)')
            .style('border', '2px solid #7972a8')
            .style('border-radius', '12px')
            .style('padding', '24px')
            .style('color', '#e2e2e2')
            .style('font-size', '13px')
            .style('min-width', '500px')
            .style('max-width', '700px')
            .style('box-shadow', '0 8px 24px rgba(0,0,0,0.4)')
            .style('display', 'none')
            .style('z-index', '2000');
        
        const detailsPanel = this.detailsPanel;

        // Bouton de fermeture
        detailsPanel.append('div')
            .attr('class', 'close-button')
            .html('✕')
            .style('position', 'absolute')
            .style('top', '10px')
            .style('right', '15px')
            .style('cursor', 'pointer')
            .style('font-size', '20px')
            .style('color', '#999')
            .style('transition', 'color 0.2s')
            .on('mouseover', function() {
                d3.select(this).style('color', '#fff');
            })
            .on('mouseout', function() {
                d3.select(this).style('color', '#999');
            })
            .on('click', () => {
                detailsPanel.style('display', 'none');
            });

        // Gestion du clic sur les cercles
        circles.on('click', (event, d) => {
            event.stopPropagation();
            this.showTrackDetails(d);
        });

        // Fermer le panneau si on clique ailleurs
        d3.select('body').on('click', () => {
            detailsPanel.style('display', 'none');
        });

        // Empêcher la fermeture si on clique dans le panneau
        detailsPanel.on('click', (event) => {
            event.stopPropagation();
        });
    }

    /**
     * Affiche les détails d'un morceau dans le panneau
     * @param {Object} d - Données du point/morceau
     */
    showTrackDetails(d) {
        const detailsPanel = this.detailsPanel;
        if (!detailsPanel) return;
        
        // Afficher le panneau
        detailsPanel.style('display', 'block');
        
        // Effacer le contenu précédent (sauf le bouton close)
        detailsPanel.selectAll(':not(.close-button)').remove();

            // Titre
            detailsPanel.append('h3')
                .style('margin', '0 0 8px 0')
                .style('color', d.color)
                .style('font-size', '18px')
                .html(`<strong>${d.metadata.track_name}</strong>`);

            detailsPanel.append('div')
                .style('color', '#aaa')
                .style('margin-bottom', '20px')
                .style('font-size', '14px')
                .text(`par ${d.metadata.artist_name} • ${d.metadata.genre}`);

            // Badge de popularité
            const popBadge = detailsPanel.append('div')
                .style('display', 'inline-block')
                .style('padding', '8px 16px')
                .style('background', `linear-gradient(135deg, ${d.color}, ${d.color}88)`)
                .style('border-radius', '20px')
                .style('font-size', '14px')
                .style('font-weight', '600')
                .style('margin-bottom', '20px')
                .text(`Popularity: ${d.metadata.popularity}/100`);

            // === INFOS DJ PERTINENTES ===
            
            // Grid layout pour les métriques principales
            const metricsGrid = detailsPanel.append('div')
                .style('display', 'grid')
                .style('grid-template-columns', 'repeat(3, 1fr)')
                .style('gap', '12px')
                .style('margin-bottom', '20px');

            // Métriques clés pour DJ
            const djMetrics = [
                { 
                    label: 'Tempo', 
                    value: `${d.metadata.tempo.toFixed(0)}`,
                    unit: 'BPM',
                    color: '#6eb6ff'
                },
                { 
                    label: 'Key', 
                    value: d.metadata.key !== undefined ? ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][d.metadata.key] : 'N/A',
                    unit: d.metadata.mode === 1 ? 'Major' : 'Minor',
                    color: '#ff6ad5'
                },
                { 
                    label: 'Energy', 
                    value: `${(d.metadata.energy * 100).toFixed(0)}`,
                    unit: '%',
                    color: '#ff6ad5'
                },
                { 
                    label: 'Dance', 
                    value: `${(d.metadata.danceability * 100).toFixed(0)}`,
                    unit: '%',
                    color: '#6eb6ff'
                },
                { 
                    label: 'Valence', 
                    value: `${((d.metadata.valence || 0) * 100).toFixed(0)}`,
                    unit: '%',
                    color: '#5be7a9'
                },
                { 
                    label: 'Loudness', 
                    value: `${(d.metadata.loudness || 0).toFixed(1)}`,
                    unit: 'dB',
                    color: '#FFB84D'
                }
            ];

            djMetrics.forEach(metric => {
                const metricCard = metricsGrid.append('div')
                    .style('padding', '12px')
                    .style('background', 'rgba(255,255,255,0.04)')
                    .style('border-radius', '8px')
                    .style('border-left', `3px solid ${metric.color}`)
                    .style('text-align', 'center');

                metricCard.append('div')
                    .style('font-size', '10px')
                    .style('color', '#aaa')
                    .style('margin-bottom', '4px')
                    .style('text-transform', 'uppercase')
                    .text(metric.label);

                metricCard.append('div')
                    .style('font-size', '20px')
                    .style('font-weight', '600')
                    .style('color', metric.color)
                    .text(metric.value);

                metricCard.append('div')
                    .style('font-size', '9px')
                    .style('color', '#888')
                    .text(metric.unit);
            });

            // Guide de transition DJ
            detailsPanel.append('h4')
                .style('margin', '16px 0 12px 0')
                .style('color', '#8e98c9')
                .style('font-size', '13px')
                .style('font-weight', '600')
                .text('Transition Suggestions');

            const djTips = detailsPanel.append('div')
                .style('padding', '12px')
                .style('background', 'rgba(121, 114, 168, 0.1)')
                .style('border-radius', '8px')
                .style('border-left', '3px solid #7972a8')
                .style('font-size', '11px')
                .style('color', '#ccc')
                .style('line-height', '1.6');

            // Générer des suggestions basées sur les métriques
            let suggestions = '';
            const tempo = d.metadata.tempo;
            const energy = d.metadata.energy * 100;
            const dance = d.metadata.danceability * 100;
            const key = d.metadata.key;

            if (tempo >= 120 && tempo <= 130) {
                suggestions += `<div style="margin-bottom: 8px;">✓ <strong>Good for house music transitions</strong> (${tempo.toFixed(0)} BPM ideal)</div>`;
            } else if (tempo >= 140) {
                suggestions += `<div style="margin-bottom: 8px;">✓ <strong>High energy track</strong> - works for peak time</div>`;
            } else if (tempo < 100) {
                suggestions += `<div style="margin-bottom: 8px;">✓ <strong>Slow groove</strong> - good for warm-up or cool-down</div>`;
            }

            if (energy > 70 && dance > 70) {
                suggestions += `<div style="margin-bottom: 8px;">🔥 <strong>Peak hour banger</strong> - high energy + very danceable</div>`;
            } else if (energy < 40 && dance < 40) {
                suggestions += `<div style="margin-bottom: 8px;">🌙 <strong>Chill vibe</strong> - perfect for lounge/ambient sets</div>`;
            }

            if (key !== undefined) {
                const keyNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                const currentKey = keyNames[key];
                const compatibleKeys = [
                    keyNames[(key + 7) % 12],  // Perfect fifth
                    keyNames[(key + 5) % 12],  // Perfect fourth
                    keyNames[(key + 2) % 12],  // Major second
                    keyNames[(key - 2 + 12) % 12]  // Minor seventh
                ];
                suggestions += `<div style="margin-bottom: 8px;">🎹 <strong>Compatible keys:</strong> ${compatibleKeys.join(', ')}</div>`;
            }

            suggestions += `<div>💡 <strong>BPM range:</strong> ${(tempo * 0.95).toFixed(0)}-${(tempo * 1.05).toFixed(0)} BPM works well</div>`;

            djTips.html(suggestions);

            // Infos additionnelles en une ligne compacte
            detailsPanel.append('div')
                .style('margin-top', '16px')
                .style('padding', '10px')
                .style('background', 'rgba(255,255,255,0.03)')
                .style('border-radius', '6px')
                .style('font-size', '11px')
                .style('color', '#aaa')
                .style('text-align', 'center')
                .html(`
                    <strong style="color: #8e98c9;">${d.metadata.genre || 'Unknown'}</strong> • 
                    ${d.metadata.year || 'N/A'} • 
                    ${d.metadata.acousticness > 0.5 ? 'Acoustic' : 'Electronic'} • 
                    ${d.metadata.liveness > 0.8 ? 'Live' : 'Studio'}
                `);
    }

    /**
     * Ajoute le brush pour la sélection interactive
     * @param {d3.Selection} g - Groupe SVG principal
     * @param {d3.Selection} circles - Sélection des cercles (peut être null initialement)
     * @param {Function} xScale - Échelle X
     * @param {Function} yScale - Échelle Y
     * @param {Array} data - Données complètes
     */
    addBrush(g, circles, xScale, yScale, data) {
        // Stocker les références pour updateBrushCircles
        this.brushCircles = circles;
        this.brushXScale = xScale;
        this.brushYScale = yScale;
        this.brushData = data;
        
        // Créer le panel de stats (caché par défaut)
        this.statsPanel = d3.select('body').append('div')
            .attr('class', 'brush-stats-panel')
            .style('position', 'fixed')
            .style('top', '120px')
            .style('right', '20px')
            .style('background', 'rgba(43, 47, 66, 0.95)')
            .style('border', '1px solid #7972a8')
            .style('border-radius', '8px')
            .style('padding', '16px')
            .style('color', '#e2e2e2')
            .style('font-size', '13px')
            .style('min-width', '250px')
            .style('max-height', '70vh')
            .style('overflow-y', 'auto')
            .style('box-shadow', '0 4px 12px rgba(0,0,0,0.3)')
            .style('display', 'none')
            .style('z-index', '1000');

        // Créer le brush
        this.brush = d3.brush()
            .extent([[0, 0], [this.innerWidth, this.innerHeight]])
            .on('start brush end', (event) => {
                const selection = event.selection;
                const currentCircles = this.brushCircles;
                
                if (!currentCircles) return; // Pas encore de cercles
                
                if (!selection) {
                    // Pas de sélection : remettre l'opacité normale et supprimer les mini camemberts
                    d3.selectAll('.mini-pie').remove();
                    currentCircles
                        .attr('opacity', 0.7)
                        .attr('stroke', '#222')
                        .attr('stroke-width', 0.3);
                    
                    this.statsPanel.style('display', 'none');
                    return;
                }

                const [[x0, y0], [x1, y1]] = selection;
                const selectedData = [];
                
                // Supprimer les anciens mini camemberts
                d3.selectAll('.mini-pie').remove();
                
                const xScale = this.brushXScale;
                const yScale = this.brushYScale;
                const self = this;
                
                currentCircles.each(function(d) {
                    const circle = this;
                    const cx = xScale(d.x);
                    const cy = yScale(d.y);
                    const isSelected = cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
                    
                    if (isSelected) {
                        selectedData.push(d);
                        // Cacher le cercle original
                        d3.select(circle).attr('opacity', 0);
                        
                        // Créer un mini camembert à la place
                        self.createMiniPie(d, cx, cy);
                    } else {
                        // Atténuer les non sélectionnés
                        d3.select(circle)
                            .attr('opacity', 0.15)
                            .attr('stroke-width', 0.3);
                    }
                });

                // Afficher les stats
                if (selectedData.length > 0) {
                    this.updateStatsPanel(this.statsPanel, selectedData, this.brushData.length);
                }
            });

        // Ajouter le brush au graphique
        this.brushGroup = g.append('g')
            .attr('class', 'brush')
            .call(this.brush);

        // Style du brush
        this.brushGroup.selectAll('.selection')
            .style('fill', 'rgba(121, 114, 168, 0.2)')
            .style('stroke', '#7972a8')
            .style('stroke-width', '2px');

        // L'overlay doit rester actif pour capturer les événements de brush
        // Les cercles recevront les événements mouseover car ils sont au-dessus
        this.brushGroup.selectAll('.overlay')
            .style('fill', 'transparent')
            .style('cursor', 'crosshair');
        
        console.log('Brush créé et activé');
    }

    /**
     * Met à jour la référence aux cercles pour le brush
     * @param {d3.Selection} circles - Sélection des cercles
     */
    updateBrushCircles(circles) {
        this.brushCircles = circles;
    }

    /**
     * Crée un mini camembert pour un point dans la sélection du brush
     * @param {Object} d - Données du point
     * @param {number} cx - Position x
     * @param {number} cy - Position y
     */
    createMiniPie(d, cx, cy) {
        // Trouver le SVG container
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        const svg = d3.select(container).select('svg');
        const g = svg.select('g');
        
        const radius = Math.max(d.size * 1.2, 5); // Taille réduite pour éviter les chevauchements
        
        // Données du mini camembert avec valeurs RÉELLES (pas normalisées)
        // Danceability + Energy + Chill (complément) = 100%
        const danceability = (d.metadata.danceability || 0) * 100;
        const energy = (d.metadata.energy || 0) * 100;
        const chill = 100 - danceability - energy; // Le "reste" = calme/repos du morceau
        
        const rawData = [
            { label: 'Danceability', value: danceability, color: '#6eb6ff' },
            { label: 'Energy', value: energy, color: '#ff6ad5' },
            { label: 'Chill', value: Math.max(chill, 0), color: '#555555' } // Gris pour le calme
        ];
        
        // Filtrer les valeurs à 0 pour un camembert plus lisible
        const pieData = rawData.filter(item => item.value > 0).map(item => ({
            ...item,
            percentage: item.value.toFixed(1)
        }));
        
        const pie = d3.pie().value(dd => dd.value).sort(null);
        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(radius);
        
        const miniPieG = g.append('g')
            .attr('class', 'mini-pie')
            .attr('transform', `translate(${cx}, ${cy})`)
            .style('cursor', 'pointer');
        
        // Ajouter le gestionnaire de clic sur le groupe entier
        miniPieG.on('click', (event) => {
            event.stopPropagation();
            this.showTrackDetails(d);
        });
        
        // Créer un tooltip pour les mini camemberts
        const miniTooltip = d3.select('body').selectAll('.mini-pie-tooltip').data([null]);
        const miniTooltipEnter = miniTooltip.enter().append('div')
            .attr('class', 'mini-pie-tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(0, 0, 0, 0.9)')
            .style('color', 'white')
            .style('padding', '6px 10px')
            .style('border-radius', '4px')
            .style('font-size', '11px')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('z-index', '10001');
        
        const tooltip = miniTooltip.merge(miniTooltipEnter);
        
        miniPieG.selectAll('path')
            .data(pie(pieData))
            .enter()
            .append('path')
            .attr('d', arc)
            .attr('fill', dd => dd.data.color)
            .attr('stroke', '#2b2f42')
            .attr('stroke-width', 0.5)
            .style('opacity', 0.9)
            .style('pointer-events', 'all')
            .style('cursor', 'pointer')
            .on('mouseover', function(event, dd) {
                d3.select(this)
                    .transition()
                    .duration(100)
                    .style('opacity', 1)
                    .attr('stroke-width', 1.5)
                    .attr('stroke', '#fff');
                
                tooltip.transition()
                    .duration(200)
                    .style('opacity', 1);
                
                tooltip.html(`
                    <div style="font-weight: 600; color: ${dd.data.color};">
                        ${dd.data.label}
                    </div>
                    <div>${dd.data.percentage}%</div>
                `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                    .duration(100)
                    .style('opacity', 0.9)
                    .attr('stroke-width', 0.5)
                    .attr('stroke', '#2b2f42');
                
                tooltip.transition()
                    .duration(300)
                    .style('opacity', 0);
            });
    }

    /**
     * Met à jour le panneau de statistiques avec camembert de distribution par genre
     * @param {d3.Selection} panel - Panel de stats
     * @param {Array} selectedData - Données sélectionnées
     * @param {number} totalCount - Nombre total de points
     */
    updateStatsPanel(panel, selectedData, totalCount) {
        panel.style('display', 'block').html('');

        // Titre avec nombre de pistes
        panel.append('div')
            .style('margin-bottom', '16px')
            .style('padding-bottom', '12px')
            .style('border-bottom', '1px solid #555')
            .html(`
                <div style="font-weight: 600; font-size: 14px; color: #7972a8; margin-bottom: 4px;">
                    Selection
                </div>
                <div style="font-size: 18px; font-weight: 600; color: #e2e2e2;">
                    ${selectedData.length} tracks
                </div>
                <div style="font-size: 11px; color: #aaa;">
                    ${((selectedData.length / totalCount) * 100).toFixed(1)}% of total
                </div>
            `);

        // Compter par genre
        const genreCounts = new Map();
        selectedData.forEach(d => {
            const genre = d.metadata.genre || 'Unknown';
            genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
        });

        // Convertir en tableau et trier (Top 6 + Others)
        const allGenres = Array.from(genreCounts, ([genre, count]) => ({ genre, count }))
            .sort((a, b) => b.count - a.count);
        
        const topGenres = allGenres.slice(0, 6);
        const othersCount = allGenres.slice(6).reduce((sum, g) => sum + g.count, 0);
        
        if (othersCount > 0) {
            topGenres.push({ genre: 'Others', count: othersCount });
        }

        // Palette de couleurs professionnelle
        const colorScale = d3.scaleOrdinal()
            .domain(topGenres.map(d => d.genre))
            .range(['#667BC6', '#9AB3F5', '#A3D8FF', '#7C93C3', '#55679C', '#1E2A5E', '#888']);

        // Titre du camembert
        panel.append('h5')
            .style('margin', '0 0 12px 0')
            .style('color', '#8e98c9')
            .style('font-size', '13px')
            .style('font-weight', '600')
            .text('Genre Distribution');

        // Créer le camembert (taille encore réduite)
        const pieWidth = 200;
        const pieHeight = 150;
        const pieRadius = Math.min(pieWidth, pieHeight) / 2 - 15;

        const svg = panel.append('svg')
            .attr('width', pieWidth)
            .attr('height', pieHeight);

        const pieG = svg.append('g')
            .attr('transform', `translate(${pieWidth / 2}, ${pieHeight / 2})`);

        const pie = d3.pie()
            .value(d => d.count)
            .sort(null);

        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(pieRadius);

        const arcs = pieG.selectAll('.arc')
            .data(pie(topGenres))
            .enter()
            .append('g')
            .attr('class', 'arc');

        arcs.append('path')
            .attr('d', arc)
            .attr('fill', d => colorScale(d.data.genre))
            .attr('stroke', '#2b2f42')
            .attr('stroke-width', 3)
            .style('opacity', 0)
            .style('cursor', 'pointer')
            .on('mouseover', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style('opacity', 1);
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style('opacity', 0.85);
            })
            .transition()
            .duration(600)
            .style('opacity', 0.85);

        // Labels avec pourcentages
        arcs.append('text')
            .attr('transform', d => {
                const centroid = arc.centroid(d);
                return `translate(${centroid[0]}, ${centroid[1]})`;
            })
            .attr('text-anchor', 'middle')
            .style('fill', 'white')
            .style('font-size', '12px')
            .style('font-weight', '700')
            .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .text(d => {
                const percent = (d.data.count / selectedData.length * 100).toFixed(0);
                return percent > 4 ? `${percent}%` : '';
            })
            .transition()
            .delay(400)
            .duration(300)
            .style('opacity', 1);

        // Légende avec grid layout
        const legendDiv = panel.append('div')
            .style('margin-top', '16px')
            .style('display', 'grid')
            .style('grid-template-columns', '1fr 1fr')
            .style('gap', '8px');

        topGenres.forEach(g => {
            const item = legendDiv.append('div')
                .style('display', 'flex')
                .style('align-items', 'center')
                .style('gap', '6px')
                .style('font-size', '10px')
                .style('padding', '4px 6px')
                .style('background', 'rgba(255,255,255,0.03)')
                .style('border-radius', '4px');

            item.append('div')
                .style('width', '10px')
                .style('height', '10px')
                .style('background', colorScale(g.genre))
                .style('border-radius', '50%')
                .style('flex-shrink', '0');

            item.append('span')
                .style('color', '#ccc')
                .style('flex', '1')
                .style('overflow', 'hidden')
                .style('text-overflow', 'ellipsis')
                .style('white-space', 'nowrap')
                .text(g.genre);

            item.append('span')
                .style('color', '#e2e2e2')
                .style('font-weight', '700')
                .text(g.count);
        });

        // Stats moyennes avec mini barres
        const avgPopularity = d3.mean(selectedData, d => d.metadata.popularity) || 0;
        const avgEnergy = d3.mean(selectedData, d => d.metadata.energy) || 0;
        const avgDanceability = d3.mean(selectedData, d => d.metadata.danceability) || 0;

        const statsDiv = panel.append('div')
            .style('margin-top', '16px')
            .style('padding-top', '12px')
            .style('border-top', '1px solid #555');

        statsDiv.append('h5')
            .style('margin', '0 0 12px 0')
            .style('font-weight', '600')
            .style('color', '#8e98c9')
            .style('font-size', '13px')
            .text('Average Metrics');

        const metrics = [
            { label: 'Popularity', value: avgPopularity, max: 100, color: '#7972a8' },
            { label: 'Energy', value: avgEnergy * 100, max: 100, color: '#ff6ad5' },
            { label: 'Danceability', value: avgDanceability * 100, max: 100, color: '#6eb6ff' },
        ];

        metrics.forEach(metric => {
            const metricDiv = statsDiv.append('div')
                .style('margin-bottom', '10px');

            const headerDiv = metricDiv.append('div')
                .style('display', 'flex')
                .style('justify-content', 'space-between')
                .style('margin-bottom', '4px')
                .style('font-size', '11px');

            headerDiv.append('span')
                .style('color', '#ccc')
                .text(metric.label);

            headerDiv.append('span')
                .style('color', metric.color)
                .style('font-weight', '700')
                .text(`${metric.value.toFixed(0)}%`);

            const barBg = metricDiv.append('div')
                .style('width', '100%')
                .style('height', '6px')
                .style('background', 'rgba(255,255,255,0.05)')
                .style('border-radius', '3px')
                .style('overflow', 'hidden');

            barBg.append('div')
                .style('height', '100%')
                .style('background', metric.color)
                .style('width', '0%')
                .transition()
                .duration(600)
                .delay(400)
                .style('width', `${metric.value}%`);
        });
    }
}
