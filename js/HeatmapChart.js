/**
 * HeatmapChart - Visualise la heatmap avec D3.js
 * Gère le rendu, les axes, la légende, les tooltips et la modale
 */
class HeatmapChart {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.width = options.width || this.getResponsiveWidth();
        this.height = options.height || this.getResponsiveHeight();
        this.margin = options.margin || { top: 80, right: 100, bottom: 80, left: 150 };
        
        this.svg = null;
        this.tooltip = null;
        this.colorScale = null;
        this.legendVisible = true;  // État de la légende
        
        this.initTooltip();
        this.initColorScale();
        this.setupResizeListener();
    }

    /**
     * Calcule la largeur responsive
     */
    getResponsiveWidth() {
        const container = document.getElementById(this.containerId);
        if (container) {
            return Math.max(container.clientWidth, 800);
        }
        return 1800;
    }

    /**
     * Calcule la hauteur responsive
     */
    getResponsiveHeight() {
        const container = document.getElementById(this.containerId);
        if (container) {
            return Math.max(container.clientHeight, 400);
        }
        return 600;
    }

    /**
     * Configure l'écouteur de redimensionnement
     */
    setupResizeListener() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (this.lastRenderData) {
                    this.width = this.getResponsiveWidth();
                    this.height = this.getResponsiveHeight();
                    this.render(...this.lastRenderData);
                }
            }, 250);
        });
    }

    /**
     * Initialise le tooltip
     */
    initTooltip() {
        // Supprimer tooltip existant
        d3.select('#heatmap-tooltip').remove();
        
        this.tooltip = d3.select('body')
            .append('div')
            .attr('id', 'heatmap-tooltip')
            .style('position', 'absolute')
            .style('visibility', 'hidden')
            .style('background-color', 'rgba(0, 0, 0, 0.9)')
            .style('color', 'white')
            .style('padding', '12px')
            .style('border-radius', '8px')
            .style('font-size', '13px')
            .style('pointer-events', 'none')
            .style('z-index', '1000')
            .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.3)');
    }

    /**
     * Initialise l'échelle de couleur
     */
    initColorScale() {
        const heatmapColors = {
            noData: getComputedStyle(document.documentElement).getPropertyValue('--heatmap-no-data').trim(),
            range0: getComputedStyle(document.documentElement).getPropertyValue('--heatmap-0-20').trim(),
            range1: getComputedStyle(document.documentElement).getPropertyValue('--heatmap-20-40').trim(),
            range2: getComputedStyle(document.documentElement).getPropertyValue('--heatmap-40-60').trim(),
            range3: getComputedStyle(document.documentElement).getPropertyValue('--heatmap-60-80').trim(),
            range4: getComputedStyle(document.documentElement).getPropertyValue('--heatmap-80-100').trim()
        };

        this.colorScale = d3.scaleThreshold()
            .domain([1, 20, 40, 60, 80])
            .range([
                heatmapColors.noData,
                heatmapColors.range0,
                heatmapColors.range1,
                heatmapColors.range2,
                heatmapColors.range3,
                heatmapColors.range4
            ]);
    }

    /**
     * Rend la heatmap
     * @param {Array} data - Cellules de heatmap à afficher
     * @param {Array} allTracks - Toutes les pistes (pour la plage d'années globale)
     * @param {Number} yearMin - Année minimale du filtre (optionnel)
     * @param {Number} yearMax - Année maximale du filtre (optionnel)
     */
    render(data, allTracks, yearMin = null, yearMax = null) {
        // Sauvegarder les données pour le redimensionnement
        this.lastRenderData = [data, allTracks, yearMin, yearMax];
        
        // Nettoyer le conteneur
        d3.select(`#${this.containerId}`).selectAll('*').remove();

        if (data.length === 0) {
            d3.select(`#${this.containerId}`)
                .append('p')
                .style('text-align', 'center')
                .style('color', '#888')
                .style('margin-top', '50px')
                .text('Aucune donnée disponible pour cette sélection.');
            return;
        }

        // Obtenir les artistes et années
        const artists = HeatmapProcessor.getUniqueArtists(data);
        const years = this.getYearRange(allTracks, yearMin, yearMax);

        // Créer les échelles
        const xScale = d3.scaleBand()
            .domain(years)
            .range([this.margin.left, this.width - this.margin.right])
            .padding(0.05);

        const yScale = d3.scaleBand()
            .domain(artists)
            .range([this.margin.top, this.height - this.margin.bottom])
            .padding(0.05);

        // Créer le SVG
        this.svg = d3.select(`#${this.containerId}`)
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${this.width} ${this.height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        // Dessiner les cellules
        this.drawCells(data, xScale, yScale);

        // Ajouter les axes
        this.drawAxes(xScale, yScale);

        // Ajouter la légende
        this.drawLegend();
        
        // Mettre à jour le bouton "Afficher la légende" si nécessaire
        this.updateLegendButton();
    }

    /**
     * Dessine les cellules de la heatmap
     */
    drawCells(data, xScale, yScale) {
        const self = this;

        this.svg.selectAll('.heatmap-cell')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'heatmap-cell')
            .attr('x', d => xScale(d.year))
            .attr('y', d => yScale(d.artist))
            .attr('width', xScale.bandwidth())
            .attr('height', yScale.bandwidth())
            .attr('fill', d => this.colorScale(d.avg_popularity))
            .attr('stroke', '#1a1a1a')
            .attr('stroke-width', 1)
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('stroke', '#ffffff')
                    .attr('stroke-width', 2);

                self.tooltip
                    .style('visibility', 'visible')
                    .html(`
                        <strong>${d.artist}</strong><br/>
                        Année: ${d.year}<br/>
                        Popularité moyenne: ${d.avg_popularity}<br/>
                        Nombre de pistes: ${d.track_count}
                    `);
            })
            .on('mousemove', function(event) {
                self.tooltip
                    .style('top', (event.pageY - 10) + 'px')
                    .style('left', (event.pageX + 10) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('stroke', '#1a1a1a')
                    .attr('stroke-width', 1);

                self.tooltip.style('visibility', 'hidden');
            })
            .on('click', (event, d) => {
                this.openModal(d);
            });
    }

    /**
     * Dessine les axes
     */
    drawAxes(xScale, yScale) {
        // Axe X (années)
        const xAxis = this.svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${this.height - this.margin.bottom})`)
            .call(d3.axisBottom(xScale));
        
        xAxis.selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end')
            .style('font-size', '12px')
            .style('fill', 'white');
        
        xAxis.selectAll('line, path')
            .style('stroke', 'white');

        // Label axe X
        this.svg.append('text')
            .attr('x', this.width / 2)
            .attr('y', this.height - 10)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('fill', 'white')
            .text('Année');

        // Axe Y (artistes)
        const yAxis = this.svg.append('g')
            .attr('class', 'y-axis')
            .attr('transform', `translate(${this.margin.left},0)`)
            .call(d3.axisLeft(yScale));
        
        yAxis.selectAll('text')
            .style('font-size', '11px')
            .style('fill', 'white');
        
        yAxis.selectAll('line, path')
            .style('stroke', 'white');

        // Label axe Y
        this.svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -this.height / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('fill', 'white')
            .text('Artiste');
    }

    /**
     * Dessine la légende avec bouton de fermeture (overlay HTML)
     */
    drawLegend() {
        // Supprimer la légende existante
        d3.select('#heatmap-legend').remove();

        if (!this.legendVisible) return;

        const legendData = [
            { range: 'Aucune donnée', color: this.colorScale(0) },
            { range: '0-20', color: this.colorScale(10) },
            { range: '20-40', color: this.colorScale(30) },
            { range: '40-60', color: this.colorScale(50) },
            { range: '60-80', color: this.colorScale(70) },
            { range: '80-100', color: this.colorScale(90) }
        ];

        // Créer la légende en overlay HTML
        const legend = d3.select('body')
            .append('div')
            .attr('id', 'heatmap-legend')
            .style('position', 'fixed')
            .style('bottom', '20px')
            .style('right', '20px')
            .style('background-color', 'rgba(30, 30, 30, 0.95)')
            .style('border', '1px solid #444')
            .style('border-radius', '8px')
            .style('padding', '15px')
            .style('z-index', '1000')
            .style('box-shadow', '0 4px 12px rgba(0, 0, 0, 0.5)');

        // Container pour le titre et le bouton close
        const header = legend.append('div')
            .style('display', 'flex')
            .style('justify-content', 'space-between')
            .style('align-items', 'center')
            .style('margin-bottom', '10px');

        // Titre
        header.append('div')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('color', 'white')
            .text('Popularité');

        // Bouton Close
        header.append('button')
            .text('✕')
            .style('background', '#222637')
            .style('border', '1px solid white')
            .style('border-radius', '50%')
            .style('width', '24px')
            .style('height', '24px')
            .style('color', 'white')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('cursor', 'pointer')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('justify-content', 'center')
            .style('padding', '0')
            .style('line-height', '1')
            .on('click', () => this.toggleLegend())
            .on('mouseenter', function() {
                d3.select(this).style('background', '#353a50');
            })
            .on('mouseleave', function() {
                d3.select(this).style('background', '#222637');
            });

        // Entrées de la légende
        const items = legend.append('div');

        legendData.forEach((item) => {
            const row = items.append('div')
                .style('display', 'flex')
                .style('align-items', 'center')
                .style('margin-bottom', '8px');

            row.append('div')
                .style('width', '20px')
                .style('height', '20px')
                .style('background-color', item.color)
                .style('border', '1px solid #1a1a1a')
                .style('margin-right', '10px');

            row.append('span')
                .style('font-size', '12px')
                .style('color', 'white')
                .text(item.range);
        });
    }

    /**
     * Affiche/masque la légende
     */
    toggleLegend() {
        this.legendVisible = !this.legendVisible;
        this.drawLegend();
        
        // Afficher le bouton "Afficher la légende" si masquée
        this.updateLegendButton();
    }

    /**
     * Met à jour le bouton pour afficher la légende
     */
    updateLegendButton() {
        // Supprimer le bouton existant
        d3.select('#show-legend-button').remove();

        if (!this.legendVisible) {
            // Créer un bouton HTML en overlay
            d3.select('body')
                .append('button')
                .attr('id', 'show-legend-button')
                .text('Afficher la légende')
                .style('position', 'fixed')
                .style('bottom', '20px')
                .style('right', '20px')
                .style('background-color', 'rgba(30, 30, 30, 0.95)')
                .style('border', '1px solid #444')
                .style('border-radius', '8px')
                .style('padding', '12px 20px')
                .style('color', 'white')
                .style('font-size', '13px')
                .style('cursor', 'pointer')
                .style('z-index', '1000')
                .style('box-shadow', '0 4px 12px rgba(0, 0, 0, 0.5)')
                .on('click', () => this.toggleLegend())
                .on('mouseenter', function() {
                    d3.select(this).style('background-color', 'rgba(50, 50, 50, 0.95)');
                })
                .on('mouseleave', function() {
                    d3.select(this).style('background-color', 'rgba(30, 30, 30, 0.95)');
                });
        }
    }

    /**
     * Ouvre la modale avec les détails
     */
    openModal(cellData) {
        // Supprimer modale existante
        d3.select('#heatmap-modal').remove();

        const modal = d3.select('body')
            .append('div')
            .attr('id', 'heatmap-modal')
            .style('position', 'fixed')
            .style('top', '0')
            .style('left', '0')
            .style('width', '100%')
            .style('height', '100%')
            .style('background-color', 'rgba(0, 0, 0, 0.7)')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('justify-content', 'center')
            .style('z-index', '2000')
            .on('click', function(event) {
                if (event.target === this) {
                    d3.select('#heatmap-modal').remove();
                }
            });

        const modalContent = modal.append('div')
            .style('background-color', '#1e1e1e')
            .style('color', 'white')
            .style('padding', '30px')
            .style('border-radius', '12px')
            .style('max-width', '600px')
            .style('width', '90%')
            .style('max-height', '80vh')
            .style('overflow-y', 'auto')
            .style('box-shadow', '0 8px 16px rgba(0, 0, 0, 0.5)');

        // Bouton fermer
        modalContent.append('button')
            .text('✕')
            .style('position', 'absolute')
            .style('top', '15px')
            .style('right', '15px')
            .style('background', 'transparent')
            .style('border', 'none')
            .style('color', 'white')
            .style('font-size', '24px')
            .style('cursor', 'pointer')
            .on('click', () => {
                d3.select('#heatmap-modal').remove();
            });

        // Titre
        modalContent.append('h2')
            .style('margin-top', '0')
            .text(`${cellData.artist} - ${cellData.year}`);

        // Statistiques
        modalContent.append('p')
            .html(`<strong>Popularité moyenne:</strong> ${cellData.avg_popularity}`);

        modalContent.append('p')
            .html(`<strong>Nombre total de pistes:</strong> ${cellData.track_count}`);

        // Liste des chansons
        modalContent.append('h3')
            .text('Top 5 des chansons:');

        const songList = modalContent.append('ol')
            .style('padding-left', '20px');

        cellData.popular_songs.forEach(song => {
            songList.append('li')
                .style('margin-bottom', '8px')
                .html(`<strong>${song.track_name}</strong> - Popularité: ${song.popularity}`);
        });
    }

    /**
     * Obtient la plage d'années complète ou filtrée
     * @param {Array} tracks - Toutes les pistes
     * @param {Number} yearMin - Année minimale du filtre (optionnel)
     * @param {Number} yearMax - Année maximale du filtre (optionnel)
     */
    getYearRange(tracks, yearMin = null, yearMax = null) {
        // Si des filtres sont appliqués, les utiliser
        if (yearMin !== null || yearMax !== null) {
            const yearRange = HeatmapProcessor.getYearRange(tracks);
            const min = yearMin !== null ? yearMin : yearRange.min;
            const max = yearMax !== null ? yearMax : yearRange.max;
            
            const years = [];
            for (let year = min; year <= max; year++) {
                years.push(year);
            }
            return years;
        }
        
        // Sinon, utiliser la plage complète
        const yearRange = HeatmapProcessor.getYearRange(tracks);
        const years = [];
        for (let year = yearRange.min; year <= yearRange.max; year++) {
            years.push(year);
        }
        return years;
    }
}

// Export pour utilisation dans d'autres fichiers
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeatmapChart;
}
