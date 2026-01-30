import React from 'react'

const salordercount = 'https://drive.google.com/file/d/1VqPV1-p0PCy-2uVhuM_jQS8xxdYFMZlZ/view?usp=drive_link';
const salorderbreakdown = 'https://drive.google.com/file/d/1Kxs46688Rgb6YJh7SeRi6AFs67-ZBeOb/view?usp=drive_link';


function Reports() {
    return (
        <div className='page reports'>
            <h2>Reports</h2>
            <p>
                <a className='App-link' href={salordercount} target="_blank" rel="noopener noreferrer">   
                    Sal Order Counts
                </a>
            </p>
            <p>
                <a className='App-link' href={salorderbreakdown} target="_blank" rel="noopener noreferrer">
                    Sal Order Breakdown
                </a> 
            </p>
        </div>   
    )
}


export default Reports;