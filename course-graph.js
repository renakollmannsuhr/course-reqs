import cytoscape from 'https://unpkg.com/cytoscape@3.29.2/dist/cytoscape.esm.min.mjs';


// Function to fetch JSON data and generate nodes
async function generateNodes(courses) {
        // Generate the list of nodes
        const nodes = courses.map(course => ({
            // Each course is a node itself
            data: { id: course.course_code }
        }));
        return nodes;
}

// Function to generate intermediate connections
async function generateConnections() {
    // TODO: more appropriately named edges because this includes all edges
    const intermediate_edges = [];
    const intermediate_nodes = [];
    for (const course of courses) {
        // We also need to generate "intermediate nodes" for each of the
        // course's one-of and all-of requirements
        // If it's not a course code generate that node as well
        for (requirement in course['prerequisites']) {
            // Create node for top level requirement
            requirement_id = `${course.course_code}-${requirement}`;
            intermediate_nodes.push(
                { data: { id: requirement_id, type: `${requirement}-join` } }
            );

            // Connect requirement to course
            intermediate_edges.push(
                { data: { id: `${requirement_id}-edge`, source: course.course_code, target: requirement_id, type: `${requirement}-edge` } }
            );

            //traverseRequirement(requirement_id, requirement, intermediate_nodes, intermediate_edges);
        }
    }
    return intermediate_nodes, intermediate_edges;
}

// Requirement is a key-value pair where the key is the type of requirement
// parent_id: string name of the parent node
// requirement: requirement object
// intermediate_nodes: list of intermediate nodes
// intermediate_edges: list of intermediate edges
async function traverseRequirement(parent_id, requirement, intermediate_nodes, intermediate_edges) {
    // Create requirement IF it is not a course code
    requirement_id = `${course.course_code}-requirement`;
    intermediate_nodes.push(
        {data: {id: requirement_id}}
    );

    // Connect requirement to its parent
    intermediate_edges.push(
        {data: {id: `${requirement_id}-edge`, source: parent_id, target: requirement_id}}
    );

    // If the requirement is a course code, we're done
    if (requirement['type'] === 'course') {
        return;
    }
}



// Function to initialize Cytoscape
async function initializeCytoscape() {
    // Fetch JSON data
    try {
        const response = await fetch('course_requirements.json');
        const courses = await response.json();
    } catch (error) {
        console.error('Error fetching JSON data:', error);
    }

    // Generate nodes
    const nodes = await generateNodes(courses);

    const connections = await generateConnections(courses);

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
                selector: 'node[type = "course"]',
                style: {
                    'background-color': '#EB8137',
                    'padding': '10px',
                    'shape': 'round-rectangle',
                    'corner-radius': 3,
                    'width': 'label',
                    'text-halign': 'center',
                    'text-valign': 'center',
                    'label': 'CSC110',
                    'font-size': '15px',
                }
            },
            {
                selector: 'node[type = "one-of-join"]',
                style: {
                    'background-color': '#46BF14',
                    'width': 20,
                    'height': 20,

                }
            },
            {
                selector: 'node[type = "two-of-join"]',
                style: {
                    'background-color': '#DDEB37',
                    'width': 20,
                    'height': 20,

                }
            },
            {
                selector: 'node[type = "all-of-join"]',
                style: {
                    'background-color': '#3371FF',
                    'width': 20,
                    'height': 20,

                }
            },
            {
                selector: 'edge[type = "one-of-edge"]',
                style: {
                    'width': 3,
                    'line-color': '#46BF14',
                    'target-arrow-color': '#46BF14',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier'
                }
            },
            {
                selector: 'edge[type = "two-of-edge"]',
                style: {
                    'width': 3,
                    'line-color': '#DDEB37',
                    'target-arrow-color': '#DDEB37',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier'
                }
            },
            {
                selector: 'edge[type = "all-of-edge"]',
                style: {
                    'width': 3,
                    'line-color': '#3371FF',
                    'target-arrow-color': '#3371FF',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier'
                }
            },
        ],
    
        layout: {
            name: 'breadthfirst',
            directed: true,
            spacingFactor: 2.75,
            animate: true,
            animationDuration: 500,
            nodeDimensionsIncludeLabels: true
        }
    });
}

// Call the function to initialize Cytoscape once the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
    initializeCytoscape();
});