import { GenreTreeNode, TreeVizResponse } from "../types";

type TreeVizParams = {
    weightBy: "nonmusical" | "danceability"
}

class TreeVizProcessor {
    private genreTree: GenreTreeNode;

    constructor(genreTree: GenreTreeNode) {
        this.genreTree = genreTree;
    }

    public getData(previous: string[], params: TreeVizParams): TreeVizResponse {
        let current = this.genreTree;

        for (let prop of previous) {
            if (!current.children || !current.children.some(child => child.name === prop)) {
                return { type: "genres", values: [] };
            }
            current = current.children.find(child => child.name === prop)!;
        }

        if (current.children && current.children.length > 0) {
            return {
                type: "genres",
                values: current.children.map(child => child.name)
            };
        } else {
            return {
                type: "songs",
                values: (current.songs || []).map(song => song.track_name)
            };
        }
    }
}

export { TreeVizProcessor };