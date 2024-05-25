import cytoscape from 'https://unpkg.com/cytoscape@3.29.2/dist/cytoscape.esm.min.mjs';


// Function to fetch JSON data and generate nodes
async function generateNodes() {
    try {
        // Fetch the JSON data
        const response = await fetch('course_requirements.json');
        const courses = await response.json();

        // Generate the list of nodes
        const nodes = courses.map(course => ({
            data: { id: course.course_code }
        }));

        return nodes;
    } catch (error) {
        console.error('Error fetching JSON data:', error);
    }
}



// Function to initialize Cytoscape
async function initializeCytoscape() {
    // Generate nodes
    const nodes = await generateNodes();

    // Initialize Cytoscape
    var cy = cytoscape({
        container: document.getElementById('cy'), // container to render in
    
        elements: [ // list of graph elements to start with
            ...nodes,
            {
                data: {id: "a"}
            },
            {
                data: {id: "b"}
            },
            { // example edge
                data: { id: 'ab', source: 'a', target: 'b' }
            }
        ],
    
        style: [ // the stylesheet for the graph
            {
                selector: 'node',
                style: {
                    'background-color': '#666',
                    'label': 'data(id)'
                }
            },
    
            {
                selector: 'edge',
                style: {
                    'width': 3,
                    'line-color': '#ccc',
                    'target-arrow-color': '#ccc',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier'
                }
            }
        ],
    
        layout: {
            name: 'breadthfirst',
            spacingFactor: 2.75,
        }
    });
}

// Call the function to initialize Cytoscape once the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
    initializeCytoscape();
});