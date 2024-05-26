import cytoscape from 'https://unpkg.com/cytoscape@3.29.2/dist/cytoscape.esm.min.mjs';


// Function to fetch JSON data and generate nodes
async function generateNodes(courses) {
        // Generate the list of nodes
        const nodes = courses.map(course => ({
            // Each course is a node itself
            data: { id: course.course_code, type: 'course' }
        }));
        return nodes;
}

// Function to generate intermediate connections
async function generateConnections(courses) {
    // TODO: more appropriately named edges because this includes all edges
    const intermediate_edges = [];
    const intermediate_nodes = [];
    for (const course of courses) {
        // We also need to generate "intermediate nodes" for each of the
        // course's one-of and all-of requirements
        // If it's not a course code generate that node as well
        for (let requirement in course['prerequisites']) {
            if (requirement === 'pre_or_corequisites') {
                continue;
            }
            // Create node for top level requirement
            let requirement_id = `${course.course_code}-${requirement}`;
            intermediate_nodes.push(
                { data: { id: requirement_id, type: `${requirement}_join` } }
            );

            // Connect requirement to course
            intermediate_edges.push(
                { data: { id: `${requirement_id}_edge1`, source: course.course_code, target: requirement_id, type: `${requirement}_edge` } }
            );

            // Traverse sub-requirements
            console.log(requirement_id);
            traverseRequirement(requirement_id, course['prerequisites'][requirement], intermediate_nodes, intermediate_edges);
        }
    }
    return [intermediate_nodes, intermediate_edges];
}

// Requirement is a key-value pair where the key is the type of requirement
// parent_id: string name of the parent requirement (node id)
// requirements: list of requirements for parent
// intermediate_nodes: list of intermediate nodes
// intermediate_edges: list of intermediate edges
const names = [];

async function traverseRequirement(parent_id, parent_requirements, intermediate_nodes, intermediate_edges) {
    const parent_list = parent_id.split('-');
    const parent_type = parent_id.split('-')[parent_list.length - 1];

    if (typeof parent_requirements === 'string') {
        console.log('IIIIIIIIIIIIIIIIIIIIIIIII', parent_requirements);
        return;
    }

    function isIterable(obj) {
        // checks for null and undefined
        if (obj == null) {
          return false;
        }
        return typeof obj[Symbol.iterator] === 'function';
    }

    if (!isIterable(parent_requirements)) {
        console.log('PARENT_REQUIREMENTS: ', parent_requirements);
    }

    for (let requirement_obj of parent_requirements) {
        // if the requirement_obj is a string we are done
        // we still need to connect it back to its parent though
        if (typeof requirement_obj === 'string') {
            // you need to create this if it doesn't already exist
            const requirement_id = requirement_obj;
            if (!requirement_id.startsWith('CSC')) {
                // Check if the node name already exists in intermediate_nodes
                const already_created = intermediate_nodes.reduce((acc, node) => {
                        return acc && ((node.data === undefined) || node.data.id !== requirement_id);
                }, true);

                if (!names.includes(requirement_id)) {
                    names.push(requirement_id);
                    console.log("CREATED NEW THING");
                    intermediate_nodes.push(
                        { data: { id: requirement_id, type: 'course' } }
                    );
                }
            }

            intermediate_edges.push(
                { data: { id: `${requirement_id}_edge2`, source: parent_id, target: requirement_id, type: `${parent_type}_edge` } }
            );
            continue;
        }

        // if the requirement_obj is an object
        for (let requirement_name in requirement_obj) {
            // make a node for requirement_name
            // IF it is not a course code
            // (some pre-requisites are strings, but not course codes, so they need to be created)
            const requirement_id = `${parent_id}-${requirement_name}`;
            intermediate_nodes.push(
                { data: { id: requirement_id, type: `${requirement_name}_join`} }
            );

            // connect requirement to parent
            console.log('3:', requirement_id);
            intermediate_edges.push(
                { data: { id: `${requirement_id}_edge3`, source: parent_id, target: requirement_id, type: `${parent_type}_edge` } }
            );

            let requirements = requirement_obj[requirement_name];
            traverseRequirement(requirement_id, requirements, intermediate_nodes, intermediate_edges);
        }
            
    }
}

// Function to create the legend
function createLegend() {
    const legend = document.getElementById('legend');
    const items = [
        { color: '#EB8137', label: 'Course Node' },
        { color: '#46BF14', label: '"Requires One-of the Above" Group Node' },
        { color: '#DDEB37', label: '"Requires Two-of the Above" Group Node' },
        { color: '#3371FF', label: '"Requires All-of the Above" Group Node' },
        //{ color: '#46BF14', label: 'One-of Edge' },
        //{ color: '#DDEB37', label: 'Two-of Edge' },
        //{ color: '#3371FF', label: 'All-of Edge' }
    ];

    items.forEach(item => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';

        const colorBox = document.createElement('div');
        colorBox.className = 'legend-color';
        colorBox.style.backgroundColor = item.color;

        // if item is a node, make it round except for course nodes
        if (item.label.includes('Node') && !item.label.includes('Course')) {
            colorBox.style.borderRadius = '50%';
            colorBox.style.width = '20px';
            colorBox.style.height = '20px';
        } else if (item.label.includes('Course')) {
            // course nodes should remain rectangular
            colorBox.style.width = '35px';
            colorBox.style.height = '20px';
            colorBox.style.borderRadius = '0px';
        }

        // if item is an edge, make it a line
        if (item.label.includes('Edge')) {
            colorBox.style.width = '50px';
            colorBox.style.height = '10px';
            colorBox.style.borderRadius = '0px';
        }

        const label = document.createElement('span');
        label.textContent = item.label;

        legendItem.appendChild(colorBox);
        legendItem.appendChild(label);
        legend.appendChild(legendItem);
    });
}

// Function to initialize Cytoscape
async function initializeCytoscape() {
    // Fetch JSON data
    const response = await fetch('course_requirements.json');
    const courses = await response.json();

    // // Generate nodes
    const nodes = await generateNodes(courses);

    const elements = await generateConnections(courses);

    // Initialize Cytoscape
    var cy = cytoscape({
        container: document.getElementById('cy'), // container to render in
    
        elements: [ // list of graph elements to start with
            { data: { id: 'CSC450', type: 'course' } },
            ...nodes,
            ...elements[0],
            ...elements[1],
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
                    'label': 'data(id)',
                    'font-size': '15px',
                    'font-family': 'verdana, sans-serif'
                }
            },
            {
                selector: 'node[type = "one_of_join"]',
                style: {
                    'background-color': '#46BF14',
                    'width': 20,
                    'height': 20,

                }
            },
            {
                selector: 'node[type = "two_of_join"]',
                style: {
                    'background-color': '#0F6F1C',
                    'width': 20,
                    'height': 20,

                }
            },
            {
                selector: 'node[type = "all_of_join"]',
                style: {
                    'background-color': '#3371FF',
                    'width': 20,
                    'height': 20,

                }
            },
            {
                selector: 'node[type = "pre_or_corequisites_join"]',
                style: {
                    'background-color': '#FA7B2D',
                    'width': 20,
                    'height': 20,

                }
            },
            {
                selector: 'edge[type = "one_of_edge"]',
                style: {
                    'width': 3,
                    'line-color': '#46BF14',
                    'target-arrow-color': '#46BF14',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier'
                }
            },
            {
                selector: 'edge[type = "two_of_edge"]',
                style: {
                    'width': 3,
                    'line-color': '#0F6F1C',
                    'target-arrow-color': '#0F6F1C',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier'
                }
            },
            {
                selector: 'edge[type = "all_of_edge"]',
                style: {
                    'width': 3,
                    'line-color': '#3371FF',
                    'target-arrow-color': '#3371FF',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier'
                }
            },
            {
                selector: 'edge[type = "pre_or_corequisites_edge"]',
                style: {
                    'width': 3,
                    'line-color': '#FA7B2D',
                    'target-arrow-color': '#FA7B2D',
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

    // Create the legend
    createLegend();
}

// Call the function to initialize Cytoscape once the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
    initializeCytoscape();
});