import React, { Component } from 'react';
import './App.css';

class Todos extends Component{
  constructor(props) {
    super(props);
    this.state = { apiResponse: [{"name": "", "date": "", "priority": ""}] };
  }

  callApi() {
    fetch("http://localhost:9000/getTodos")
      .then(res => res.text())
      .then(res => this.setState({ apiResponse: JSON.parse(res) }))
      .catch(err => err);
  }

  componentDidMount() {
    this.callApi();
  }

  render() {
    return (
      <div class="container-fluid">
        <div class="row">
          <div class="col-md-12">
            <table class="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Date</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {this.state.apiResponse.map(item => (
                  <tr class={item.priority === "high" ? "table-danger" : "table-active"}>
                    <td>{item.name}</td>
                    <td>{item.date}</td>
                    <td>{item.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

export default Todos;