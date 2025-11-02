// Utilisation de D3 global chargé dans timeline.html

export class TimelineChart {
    constructor(container, config = {}) {
        this.container = container;
        this.config = {
            width: 800,
            height: 600,
            margin: { top: 50, right: 50, bottom: 50, left: 50 },
            centerBoxWidth: 800, // Largeur de la boîte centrale encadrée (doublée)
            ...config
        };
        
        this.data = [];
        this.currentCenterTempo = 120;
        this.tempoRange = 3;
        this.selectedTrack = null;
        this.isAnimating = false; // Ajouter flag d'animation
        
        this.svg = null;
        this.g = null;
        this.eventHandlers = new Map();
        this.tooltip = null; // Ajouter référence au tooltip
        
        this.setupScales();
    }

    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
        return this;
    }

    emit(event, data) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).forEach(handler => handler(data));
        }
    }

    setData(data) {
        this.data = data.filter(d => d.tempo > 0 && d.tempo < 250);
        return this;
    }

    updateData(data) {
        this.setData(data);
        if (this.svg) {
            this.updateVisualization();
        }
        return this;
    }

    setupScales() {
        // Échelle pour la partie centrale encadrée
        const totalWidth = this.config.width - this.config.margin.left - this.config.margin.right;
        const centerBoxStart = (totalWidth - this.config.centerBoxWidth ) / 2;
        
        this.xScale = d3.scaleLinear()
            .range([centerBoxStart, centerBoxStart + this.config.centerBoxWidth]);

        // Échelle pour le côté gauche (de 0 jusqu'au début de la boîte centrale)
        this.leftScale = d3.scaleLinear()
            .range([0, centerBoxStart - 60]);

        // Échelle pour le côté droit (de la fin de la boîte centrale jusqu'à la fin)
        this.rightScale = d3.scaleLinear()
            .range([centerBoxStart + 50 + this.config.centerBoxWidth, totalWidth]);

        this.yScale = d3.scaleLinear()
            .domain([0, 1])
            .range([this.config.height - this.config.margin.top - this.config.margin.bottom, 0]);

        // Couleurs modernes cohérentes avec les autres pages
        const genreColors = {
            'pop': '#6eb6ff',
            'rock': '#ff7f0e', 
            'hip-hop': '#2ca02c',
            'rap': '#2ca02c', 
            'electronic': '#d62728',
            'electro': '#d62728', 
            'dance': '#9467bd',
            'jazz': '#8c564b',
            'country': '#e377c2',
            'folk': '#7f7f7f',
            'metal': '#bcbd22',
            'classical': '#17becf',
            'reggae': '#5be7a9',
            'blues': '#ff6ad5',
            'latin': '#8e98c9',
            'r&b': '#FFB64D',
            'indie': '#6eb6ff',
            'alternative': '#ff7f0e',
            'punk': '#d62728',
            'soul': '#e377c2'
        };
        
        this.colorScale = d3.scaleOrdinal()
            .unknown('#999999'); // Couleur par défaut pour les genres non mappés
        
        // Fonction pour obtenir la couleur d'un genre
        this.getGenreColor = (genre) => {
            if (!genre) return '#999999';
            return genreColors[genre.toLowerCase()] || '#999999';
        };
        
        this.sizeScale = d3.scaleSqrt().domain([0, 100]).range([4, 15]);
    }

    updateScales() {
        this.xScale.domain([
            this.currentCenterTempo - this.tempoRange,
            this.currentCenterTempo + this.tempoRange
        ]);

        // Échelle gauche : de (centre-30) à (centre-4)
        this.leftScale.domain([
            this.currentCenterTempo - 30,
            this.currentCenterTempo - 4
        ]);

        // Échelle droite : de (centre+4) à (centre+30)
        this.rightScale.domain([
            this.currentCenterTempo + 4,
            this.currentCenterTempo + 30
        ]);

        const genres = [...new Set(this.data.map(d => d.genre || d.track_genre))];
        // Pas besoin de mettre à jour le domain car on utilise maintenant getGenreColor
    }

    render() {
        this.createSVG();
        this.updateScales();
        this.drawAxis();
        this.drawTracks();
        this.setupEventHandlers();
        return this;
    }

    createSVG() {
        d3.select(this.container).selectAll('*').remove();

        this.svg = d3.select(this.container)
            .append('svg')
            .attr('width', this.config.width)
            .attr('height', this.config.height);

        this.g = this.svg.append('g')
            .attr('transform', `translate(${this.config.margin.left},${this.config.margin.top})`);
            
        // Créer le tooltip
        this.createTooltip();
    }

    createTooltip() {
        // Supprimer l'ancien tooltip s'il existe
        d3.select(this.container).select('.timeline-tooltip').remove();
        
        // Créer le nouveau tooltip
        this.tooltip = d3.select(this.container)
            .append('div')
            .attr('class', 'timeline-tooltip')
            .style('position', 'absolute')
            .style('pointer-events', 'none');
    }

    showTooltip(event, track) {
        if (!this.tooltip) return;
        
        this.tooltip
            .html(`
                <div class="tooltip-title">${track.track_name}</div>
                <div class="tooltip-artist">${track.artist_name}</div>
            `)
            .classed('visible', true);
            
        // Positionner le tooltip par rapport à la souris
        const containerRect = this.container.getBoundingClientRect();
        const x = event.clientX - containerRect.left;
        const y = event.clientY - containerRect.top;
        
        // Ajuster la position pour éviter que le tooltip sorte du conteneur
        const tooltipRect = this.tooltip.node().getBoundingClientRect();
        let tooltipX = x + 10;
        let tooltipY = y - 10;
        
        // Vérifier les bords
        if (tooltipX + tooltipRect.width > this.config.width) {
            tooltipX = x - tooltipRect.width - 10;
        }
        if (tooltipY < 0) {
            tooltipY = y + 20;
        }
        
        this.tooltip
            .style('left', tooltipX + 'px')
            .style('top', tooltipY + 'px');
    }

    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.classed('visible', false);
        }
    }

    drawAxis() {
        this.g.selectAll('.axis, .tempo-line, .vertical-line, .center-box, .extended-axis, .axis-labels, .center-horizontal-line').remove();

        const chartHeight = this.config.height - this.config.margin.top - this.config.margin.bottom;
        const axisHeight = chartHeight - 40; // Placer l'axe en bas (avec un peu de marge pour les labels)
        const totalWidth = this.config.width - this.config.margin.left - this.config.margin.right;
        const centerBoxStart = (totalWidth - this.config.centerBoxWidth) / 2;
        
        // === PARTIE CENTRALE ENCADRÉE ===
        
        // Définir un clipping path pour limiter les points à la boîte centrale
        const clipBoxX = centerBoxStart - 5 - (this.config.centerBoxWidth * 0.05);
        const clipBoxY = chartHeight * 0.1;
        const clipBoxWidth = this.config.centerBoxWidth * 1.1;
        const clipBoxHeight = chartHeight * 0.8;
        
        this.g.append('defs').append('clipPath')
            .attr('id', 'center-box-clip')
            .append('rect')
            .attr('x', clipBoxX)
            .attr('y', clipBoxY)
            .attr('width', clipBoxWidth)
            .attr('height', clipBoxHeight);
        
        // Encadrement gris de la partie centrale
        this.g.append('rect')
            .attr('class', 'center-box')
            .attr('x', clipBoxX)
            .attr('y', clipBoxY)
            .attr('width', clipBoxWidth)
            .attr('height', clipBoxHeight)
            .style('fill', 'none')
            .style('stroke', '#666')
            .style('stroke-width', 2);

        // Axe principal de la partie centrale
        const xAxis = this.g.append('g')
            .attr('class', 'axis')
            .attr('transform', `translate(0,${axisHeight})`);

        // Ligne principale de l'axe central
        xAxis.append('line')
            .attr('x1', centerBoxStart)
            .attr('x2', centerBoxStart + this.config.centerBoxWidth)
            .attr('y1', 0)
            .attr('y2', 0)
            .style('stroke', '#a7a7a7ff')
            .style('stroke-width', 1);

        // Tempo ticks et lignes verticales pour la partie centrale (espacement normal)
        const tempoTicks = d3.range(
            Math.ceil(this.currentCenterTempo - this.tempoRange),
            Math.floor(this.currentCenterTempo + this.tempoRange) + 1,
            1  // Retour à l'espacement normal (1 BPM)
        );

        // Lignes verticales pour chaque BPM dans la partie centrale
        this.g.selectAll('.vertical-line')
            .data(tempoTicks)
            .enter().append('line')
            .attr('class', 'vertical-line')
            .attr('x1', d => this.xScale(d))
            .attr('x2', d => this.xScale(d))
            .attr('y1', 0)
            .attr('y2', axisHeight)
            .style('stroke', 'var(--grey)')
            .style('stroke-width', 2)
            .style('opacity', 0.6);

        // Ticks de la partie centrale avec labels
        const ticks = xAxis.selectAll('.tick')
            .data(tempoTicks)
            .enter().append('g')
            .attr('class', 'tick')
            .attr('transform', d => `translate(${this.xScale(d)},0)`);

        ticks.append('line')
            .attr('y1', -5)
            .attr('y2', 5)
            .style('stroke', '#666');

        ticks.append('text')
            .attr('y', 20)
            .style('fill', '#b3b3b3')
            .style('font-size', '12px')
            .style('text-anchor', 'middle')
            .text(d => d );

        // === AXES ÉTENDUS SUR LES CÔTÉS ===
        
        // Axe étendu complet
        const extendedAxis = this.g.append('g')
            .attr('class', 'extended-axis')
            .attr('transform', `translate(0,${axisHeight})`);

        // Ligne de l'axe étendu (côté gauche)
        extendedAxis.append('line')
            .attr('x1', 0)
            .attr('x2', centerBoxStart)
            .attr('y1', 0)
            .attr('y2', 0)
            .style('stroke', '#a7a7a7ff')
            .style('stroke-width', 1);

        // Ligne de l'axe étendu (côté droit)
        extendedAxis.append('line')
            .attr('x1', centerBoxStart + this.config.centerBoxWidth)
            .attr('x2', totalWidth)
            .attr('y1', 0)
            .attr('y2', 0)
            .style('stroke', '#a7a7a7ff')
            .style('stroke-width', 1);

        // Ticks fins sur les côtés - séparés en deux échelles distinctes
        
        // Côté gauche : de (centre-30) à (centre-4), graduations de 2 BPM (plus espacées)
        const leftTicks = [];
        for (let bpm = this.currentCenterTempo - 30; bpm <= this.currentCenterTempo - 4; bpm += 2) {
            leftTicks.push(bpm);
        }
        
        // Côté droit : de (centre+4) à (centre+30), graduations de 2 BPM (plus espacées)
        const rightTicks = [];
        for (let bpm = this.currentCenterTempo + 4; bpm <= this.currentCenterTempo + 30; bpm += 2) {
            rightTicks.push(bpm);
        }

        // Calculer le nombre de musiques par BPM pour les côtés
        const tracksByBPM = d3.group(this.data, d => Math.round(d.tempo));
        const maxTracks = Math.max(...Array.from(tracksByBPM.values()).map(tracks => tracks.length), 1);

        // Affichage des ticks côté gauche
        const leftTicksGroup = extendedAxis.selectAll('.left-tick')
            .data(leftTicks)
            .enter().append('g')
            .attr('class', 'left-tick')
            .attr('transform', d => `translate(${this.leftScale(d)},0)`);

        // Traits verticaux gris fins en arrière-plan pour côté gauche
        leftTicksGroup.append('line')
            .attr('y1', -axisHeight)
            .attr('y2', 0)
            .style('stroke', 'var(--grey)')
            .style('stroke-width', 0.5)
            .style('opacity', 0.3);

        // Traits verticaux gris proportionnels pour côté gauche (par-dessus)
        leftTicksGroup.append('line')
            .attr('y1', d => {
                const tracksAtBPM = tracksByBPM.get(d) || [];
                const trackCount = tracksAtBPM.length;
                const lineHeight = (trackCount / maxTracks) * (chartHeight * 0.8);
                const centerY = chartHeight / 2; // Centre réel du graphique
                return centerY - axisHeight - lineHeight / 2; // Décaler par rapport à l'axe
            })
            .attr('y2', d => {
                const tracksAtBPM = tracksByBPM.get(d) || [];
                const trackCount = tracksAtBPM.length;
                const lineHeight = (trackCount / maxTracks) * (chartHeight * 0.8);
                const centerY = chartHeight / 2; // Centre réel du graphique
                return centerY - axisHeight + lineHeight / 2; // Décaler par rapport à l'axe
            })
            .style('stroke', d => {
                const tracksAtBPM = tracksByBPM.get(d) || [];
                if (tracksAtBPM.length === 0) return 'var(--grey)';
                
                // Compter les genres à ce BPM
                const genreCounts = {};
                tracksAtBPM.forEach(track => {
                    genreCounts[track.genre] = (genreCounts[track.genre] || 0) + 1;
                });
                
                // Trouver le genre le plus présent
                const dominantGenre = Object.keys(genreCounts).reduce((a, b) => 
                    genreCounts[a] > genreCounts[b] ? a : b
                );
                
                return this.getGenreColor(dominantGenre);
            })
            .style('stroke-width', d => {
                const tracksAtBPM = tracksByBPM.get(d) || [];
                const trackCount = tracksAtBPM.length;
                return Math.max(2, Math.min(8, 2 + (trackCount / maxTracks) * 6));
            })
            .style('stroke-linecap', 'round')
            .style('opacity', 0.8)
            .style('cursor', 'pointer')
            .on('click', (event, d) => {
                event.stopPropagation();
                console.log('Left bar clicked, BPM:', d);
                this.centerOnTempo(d);
            })
            .on('mouseover', function() {
                d3.select(this).style('opacity', 1);
            })
            .on('mouseout', function() {
                d3.select(this).style('opacity', 0.8);
            });

        // Petits traits sur l'axe côté gauche
        leftTicksGroup.append('line')
            .attr('y1', -3)
            .attr('y2', 3)
            .style('stroke', '#444')
            .style('stroke-width', 1);

        // Labels BPM pour côté gauche (1 fois sur 4, même taille que le centre)
        leftTicksGroup
            .filter(d => d % 8 === 0)
            .append('text')
            .attr('y', 20)
            .style('fill', '#b3b3b3')
            .style('font-size', '12px')
            .style('text-anchor', 'middle')
            .text(d => d);

        // Affichage des ticks côté droit
        const rightTicksGroup = extendedAxis.selectAll('.right-tick')
            .data(rightTicks)
            .enter().append('g')
            .attr('class', 'right-tick')
            .attr('transform', d => `translate(${this.rightScale(d)},0)`);

        // Traits verticaux gris fins en arrière-plan pour côté droit
        rightTicksGroup.append('line')
            .attr('y1', -axisHeight)
            .attr('y2', 0)
            .style('stroke', 'var(--grey)')
            .style('stroke-width', 0.5)
            .style('opacity', 0.3);

        // Traits verticaux gris proportionnels pour côté droit (par-dessus)
        rightTicksGroup.append('line')
            .attr('y1', d => {
                const tracksAtBPM = tracksByBPM.get(d) || [];
                const trackCount = tracksAtBPM.length;
                const lineHeight = (trackCount / maxTracks) * (chartHeight * 0.8);
                const centerY = chartHeight / 2; // Centre réel du graphique
                return centerY - axisHeight - lineHeight / 2; // Décaler par rapport à l'axe
            })
            .attr('y2', d => {
                const tracksAtBPM = tracksByBPM.get(d) || [];
                const trackCount = tracksAtBPM.length;
                const lineHeight = (trackCount / maxTracks) * (chartHeight * 0.8);
                const centerY = chartHeight / 2; // Centre réel du graphique
                return centerY - axisHeight + lineHeight / 2; // Décaler par rapport à l'axe
            })
            .style('stroke', d => {
                const tracksAtBPM = tracksByBPM.get(d) || [];
                if (tracksAtBPM.length === 0) return 'var(--grey)';
                
                // Compter les genres à ce BPM
                const genreCounts = {};
                tracksAtBPM.forEach(track => {
                    genreCounts[track.genre] = (genreCounts[track.genre] || 0) + 1;
                });
                
                // Trouver le genre le plus présent
                const dominantGenre = Object.keys(genreCounts).reduce((a, b) => 
                    genreCounts[a] > genreCounts[b] ? a : b
                );
                
                return this.getGenreColor(dominantGenre);
            })
            .style('stroke-width', d => {
                const tracksAtBPM = tracksByBPM.get(d) || [];
                const trackCount = tracksAtBPM.length;
                return Math.max(2, Math.min(8, 2 + (trackCount / maxTracks) * 6));
            })
            .style('stroke-linecap', 'round')
            .style('opacity', 0.6)
            .style('cursor', 'pointer')
            .on('click', (event, d) => {
                event.stopPropagation();
                console.log('Right bar clicked, BPM:', d);
                this.centerOnTempo(d);
            })
            .on('mouseover', function() {
                d3.select(this).style('opacity', 1);
            })
            .on('mouseout', function() {
                d3.select(this).style('opacity', 0.6);
            });

        // Petits traits sur l'axe côté droit
        rightTicksGroup.append('line')
            .attr('y1', -3)
            .attr('y2', 3)
            .style('stroke', '#444')
            .style('stroke-width', 1);

        // Labels BPM pour côté droit (1 fois sur 4, même taille que le centre)
        rightTicksGroup
            .filter(d => d % 8 === 0)
            .append('text')
            .attr('y', 20)
            .style('fill', '#b3b3b3')
            .style('font-size', '12px')
            .style('text-anchor', 'middle')
            .text(d => d);

        // === LIGNE CENTRALE MISE EN VALEUR ===
        
        // Center line (highlighted) - seulement dans la partie centrale
        this.g.append('line')
            .attr('class', 'tempo-line')
            .attr('x1', this.xScale(this.currentCenterTempo))
            .attr('x2', this.xScale(this.currentCenterTempo))
            .attr('y1', 0)
            .attr('y2', axisHeight)
            .style('stroke', '#7972a8')
            .style('stroke-width', 3)
            .style('opacity', 0.8);

        // === TRAIT FIN HORIZONTAL AU MILIEU ===
        
        // Ligne horizontale fine au centre du graphique
        const centerY = chartHeight / 2;
        this.g.append('line')
            .attr('class', 'center-horizontal-line')
            .attr('x1', 0)
            .attr('x2', totalWidth)
            .attr('y1', centerY)
            .attr('y2', centerY)
            .style('stroke', '#666')
            .style('stroke-width', 1)
            .style('opacity', 0.4);

        // === LABELS DES AXES AVEC FLÈCHES ===
        
        // Définir un marqueur de flèche pour l'axe horizontal
        const defs = this.g.select('defs').empty() ? this.g.append('defs') : this.g.select('defs');
        
        // Marqueur de flèche horizontale (droite)
        defs.append('marker')
            .attr('id', 'arrow-right')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 8)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .style('fill', '#a7a7a7ff')
            .style('stroke', 'none');
            
        // Marqueur de flèche verticale (haut)
        defs.append('marker')
            .attr('id', 'arrow-up')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 5)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', '270')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .style('fill', '#a7a7a7ff')
            .style('stroke', 'none');

        // Axe horizontal complet avec flèche
        this.g.append('line')
            .attr('class', 'axis-labels')
            .attr('x1', 0)
            .attr('x2', totalWidth)
            .attr('y1', axisHeight)
            .attr('y2', axisHeight)
            .style('stroke', '#a7a7a7ff')
            .style('stroke-width', 1)
            .attr('marker-end', 'url(#arrow-right)');

        // Label pour l'axe des tempos (en bas)
        this.g.append('text')
            .attr('class', 'axis-labels')
            .attr('x', totalWidth / 2)
            .attr('y', axisHeight + 35)
            .style('text-anchor', 'middle')
            .style('fill', '#b3b3b3')
            .style('font-size', '14px')
            .style('font-weight', '500')
            .text('Tempo (bpm)');

        // Axe vertical pour les musiques avec flèche (ne va pas jusqu'en bas)
        this.g.append('line')
            .attr('class', 'axis-labels')
            .attr('x1', 0)
            .attr('x2', 0)
            .attr('y1', axisHeight)
            .attr('y2', 0)
            .style('stroke', '#a7a7a7ff')
            .style('stroke-width', 1)
            .attr('marker-end', 'url(#arrow-up)');

        // Label pour l'axe des musiques (côté gauche, vertical)
        this.g.append('text')
            .attr('class', 'axis-labels')
            .attr('x', -chartHeight / 2)
            .attr('y', -15)
            .attr('transform', 'rotate(-90)')
            .style('text-anchor', 'middle')
            .style('fill', '#b3b3b3')
            .style('font-size', '14px')
            .style('font-weight', '500')
            .text('Musiques');
    }

    drawTracks() {
        // Ne pas redessiner si une animation est en cours
        if (this.isAnimating) {
            console.log('Animation in progress, skipping drawTracks');
            return;
        }
        
        this.g.selectAll('.track-circle').remove();

        const visibleTracks = this.data.filter(d => 
            d.tempo >= this.currentCenterTempo - 70 &&
            d.tempo <= this.currentCenterTempo + 70
        );

        // Grouper les morceaux par BPM entier
        const tracksByBPM = d3.group(visibleTracks, d => Math.round(d.tempo));
        
        // Calculer les positions Y pour chaque groupe avec espacement fixe de 40px
        const chartHeight = this.config.height - this.config.margin.top - this.config.margin.bottom;
        const centerY = chartHeight / 2;
        const pointSpacing = 40; // Espacement fixe de 40px

        tracksByBPM.forEach((tracks, bpm) => {
            // Recalculer les positions de base pour tous les tracks
            tracks.forEach((track, index) => {
                if (tracks.length === 1) {
                    // Si un seul morceau, le centrer
                    track.yPosition = centerY;
                    track.yOffset = 0;
                } else {
                    // Espacer les morceaux de 40px autour du centre
                    const totalHeight = (tracks.length - 1) * pointSpacing;
                    const startY = centerY - totalHeight / 2;
                    track.yPosition = startY + (index * pointSpacing);
                    track.yOffset = track.yPosition - centerY;
                }
                // Positionner exactement sur la ligne BPM
                track.xPosition = bpm;
            });
        });

        const circles = this.g.selectAll('.track-circle')
            .data(visibleTracks, d => d.track_id)
            .enter().append('circle')
            .attr('class', 'track-circle')
            .attr('cx', d => this.xScale(d.xPosition))
            .attr('cy', d => d.yPosition)
            .attr('r', d => this.sizeScale(d.popularity))
            .style('fill', d => this.getGenreColor(d.genre || d.track_genre))
            .style('opacity', 0.7)
            .style('cursor', 'pointer')
            .attr('clip-path', 'url(#center-box-clip)'); // Appliquer le clipping

        circles
            .on('click', (event, d) => {
                event.stopPropagation();
                console.log('=== CLICK DETECTED ===');
                console.log('Track clicked:', d.track_name, 'BPM:', d.tempo, 'Position:', d.yPosition);
                console.log('Track data:', d);
                this.selectTrack(d);
            })
            .on('mouseover', (event, d) => {
                d3.select(event.target).style('opacity', 1);
                this.showTooltip(event, d);
            })
            .on('mouseout', (event, d) => {
                if (!d3.select(event.target).classed('selected')) {
                    d3.select(event.target).style('opacity', 0.7);
                }
                this.hideTooltip();
            })
            .on('mousemove', (event, d) => {
                this.showTooltip(event, d);
            });

        circles.attr('r', 0)
            .transition()
            .duration(0)
            .delay(0)
            .attr('r', d => this.sizeScale(d.popularity));

        console.log(`Timeline: ${visibleTracks.length} tracks displayed in ${tracksByBPM.size} BPM groups`);
    }

    setupEventHandlers() {
        setTimeout(() => {
            if (this.svg) {
                // Supprimer l'ancien système de clic gauche/droite
                // Maintenant la navigation se fait en cliquant sur les points
                
                d3.select(document).on('click.timeline', (event) => {
                    if (!event.target.closest('.track-circle') && !event.target.closest('.now-playing')) {
                        this.deselectTrack();
                    }
                });
            }
        }, 100);
    }

    selectTrack(track) {
        console.log('=== SELECT TRACK CALLED ===');
        console.log('Selected track:', track.track_name);
        
        this.selectedTrack = track;
        
        // SOLUTION SIMPLE : juste centrer le tempo et animer le point, SANS redessiner
        const targetTempo = Math.round(track.tempo);
        this.currentCenterTempo = targetTempo; // Changer directement sans animation
        this.updateScales(); // Juste mettre à jour les échelles
        this.drawAxis(); // Redessiner juste l'axe
        
        // REPOSITIONNER TOUS LES POINTS HORIZONTALEMENT
        this.g.selectAll('.track-circle')
            .attr('cx', d => this.xScale(Math.round(d.tempo)));
        
        // Maintenant animer le point vers le centre
        this.animateTrackToCenter(track);
        
        this.emit('trackSelected', track);
    }

    animateTrackToCenter(selectedTrack) {
        console.log('=== ANIMATE TO CENTER CALLED ===');
        if (!selectedTrack) {
            console.log('ERROR: No selected track');
            return;
        }

        this.isAnimating = true; // Marquer le début de l'animation
        
        const chartHeight = this.config.height - this.config.margin.top - this.config.margin.bottom;
        const centerY = chartHeight / 2;
        const bpm = Math.round(selectedTrack.tempo);
        const pointSpacing = 40;

        console.log('Chart height:', chartHeight, 'Center Y:', centerY, 'BPM:', bpm);

        // Trouver tous les tracks VISIBLES du même BPM (mêmes que dans drawTracks)
        const visibleTracks = this.data.filter(d => 
            d.tempo >= this.currentCenterTempo - 70 &&
            d.tempo <= this.currentCenterTempo + 70
        );
        
        const sameTempoTracks = visibleTracks.filter(d => Math.round(d.tempo) === bpm);
        console.log('Visible tracks:', visibleTracks.length, 'Same tempo tracks:', sameTempoTracks.length);
        
        // Trouver l'index du track sélectionné dans ce groupe
        const selectedIndex = sameTempoTracks.findIndex(t => t.track_id === selectedTrack.track_id);
        console.log('Selected index:', selectedIndex);
        
        if (selectedIndex === -1) {
            console.log('ERROR: Selected track not found in visible tracks');
            this.isAnimating = false; // Réinitialiser le flag
            return;
        }
        
        // Repositionner tous les tracks avec le sélectionné au centre
        sameTempoTracks.forEach((track, index) => {
            const oldPosition = track.yPosition;
            // Calculer la position relative par rapport au track sélectionné
            const relativeIndex = index - selectedIndex;
            const newOffset = relativeIndex * pointSpacing;
            
            track.yOffset = newOffset;
            track.yPosition = centerY + newOffset;
            
            console.log(`Track ${track.track_name}: index ${index}, relative ${relativeIndex}, ${oldPosition} -> ${track.yPosition}`);
        });

        // Animer tous les points de ce BPM vers leurs nouvelles positions
        const circles = this.g.selectAll('.track-circle')
            .filter(d => Math.round(d.tempo) === bpm);
            
        console.log('Found', circles.size(), 'circles to animate');
            
        circles
            .transition()
            .duration(1200) // Animation plus lente pour mieux voir
            .ease(d3.easeCubicOut)
            .attr('cy', d => {
                console.log(`Animating ${d.track_name} to:`, d.yPosition);
                return d.yPosition;
            })
            .on('end', () => {
                console.log('Animation completed');
                this.isAnimating = false; // Marquer la fin de l'animation
            });
    }

    deselectTrack() {
        this.selectedTrack = null;
        this.g.selectAll('.track-circle')
            .classed('selected', false)
            .style('opacity', 0.7);
        this.emit('trackDeselected');
    }

    panTimeline(deltaTempo) {
        const newTempo = Math.max(60, Math.min(200, this.currentCenterTempo + deltaTempo));
        this.animateToTempo(newTempo);
    }

    centerOnTempo(targetTempo) {
        console.log('Centering on tempo:', targetTempo);
        // Déselectionner le track actuel si il y en a un
        this.deselectTrack();
        // Animer vers le nouveau tempo central
        this.animateToTempo(targetTempo);
    }

    animateToTempo(targetTempo, onComplete = null) {
        const startTempo = this.currentCenterTempo;
        const startTime = Date.now();
        const duration = 800;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            this.currentCenterTempo = startTempo + (targetTempo - startTempo) * easeProgress;
            this.updateVisualization();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Animation terminée
                if (this.selectedTrack) {
                    this.g.selectAll('.track-circle')
                        .classed('selected', d => d.track_id === this.selectedTrack.track_id)
                        .style('opacity', d => d.track_id === this.selectedTrack.track_id ? 1 : 0.7);
                }
                // Appeler le callback si fourni
                if (onComplete) {
                    onComplete();
                }
            }
        };

        animate();
    }

    updateVisualization() {
        this.updateScales();
        this.drawAxis();
        
        // Préserver les positions relatives des tracks si un track est sélectionné
        if (this.selectedTrack) {
            this.preserveTrackPositions();
        }
        
        this.drawTracks();
    }

    preserveTrackPositions() {
        // Garder les positions Y existantes pour les tracks déjà positionnés
        // Cela évite de recalculer les positions quand on navigue
        const chartHeight = this.config.height - this.config.margin.top - this.config.margin.bottom;
        const centerY = chartHeight / 2;
        
        this.data.forEach(track => {
            if (track.yOffset !== undefined) {
                track.yPosition = centerY + track.yOffset;
            }
        });
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
}