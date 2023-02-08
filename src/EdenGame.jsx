import React from "react";
import axios from 'axios'
import {Button, message} from "antd";
import {ethers} from "ethers";
import './App.css'

const node = "https://fullnode.devnet.aptoslabs.com/v1/"
const addr = "0x48e70e47ec16a0d49e369b419c96998538a8d99c889bf1b433a66c10a79fb1e1";
let init_counter = addr + '::GameIndex::init_counter'
let entry_join_game = addr + '::GameIndex::entry_join_game'
let entry_game_start = addr + '::GameIndex::entry_game_start'

class EdenGame extends React.Component {

    constructor() {
        super();
        this.state = {
            address: "",
            hash:"",
            gameData: {},
            playerAAddr: "",
            playerBAddr: "",
            playerAStatus: "",
            playerBStatus: "",
            playAData: {},
            playBData: {}
        };
    }

    connectWallet = async () => {
        const response = await window.aptos.connect()
        console.log("connectWallet===",response.address)
        this.setState({ address: response.address });
        if (response.address != "") {
            message.info("Connected.");
        }
        this.get_game();
    }

    init_func = async () =>{
        const transaction = {
            type: "entry_function_payload",
            function: init_counter,
            arguments: [],
            type_arguments: [],
        };

        console.log("init transaction=====", transaction);
        await window.aptos.connect()
        let ret = await window.aptos.signAndSubmitTransaction(transaction);
        console.log('ret', ret);
        this.setState({
            address: this.state.address ,
            hash:ret.hash
        });
        message.info("Initialization successfully.");
        this.get_game();
    }

    game_join = async () =>{
        const transaction = {
            type: "entry_function_payload",
            function: entry_join_game,
            arguments: [],
            type_arguments: [],
        };
        await window.aptos.connect()
        let ret = await window.aptos.signAndSubmitTransaction(transaction);
        console.log('ret', ret.hash);
        this.setState({
            address: this.state.address,
            hash:ret.hash
        });
        message.info("Join game successfully.");
        this.get_game();
    }

    game_start = async (num) =>{
        console.log("num==",num);
        const transaction = {
            type: "entry_function_payload",
            function: entry_game_start,
            arguments: [num],
            type_arguments: [],
        };
        await window.aptos.connect()
        let ret = await window.aptos.signAndSubmitTransaction(transaction);
        console.log('ret', ret.hash);
        this.setState({
            address: this.state.address,
            hash:ret.hash
        });
        message.info(" game successfully.");
        this.get_game();

    }

    get_game = () => {
        let url = node + "accounts/" + addr + "/resources"
        axios.get(url).then(
            response => {
                response.data.map((val, key) => {
                    if (val.type === addr + "::GameIndex::Game") {           

                        if (val.data.addr.length == 1) {
                            this.get_userInfo(val.data.addr[0], 0);
                            this.setState({
                                playerAAddr: val.data.addr[0].substring(0,10) + "..." + val.data.addr[0].substring(val.data.addr[0].length-8),
                                playerBAddr: "waiting for joining game."
                            });
                        } else if (val.data.addr.length == 2) {                      
                            this.get_userInfo(val.data.addr[0], 0);                        
                            this.get_userInfo(val.data.addr[1], 1);
                            let status_A;
                            let status_B;

                            if (this.state.playAData.round > this.state.playBData.round) {
                                status_A = "Done"
                                status_B = "Waiting"
                            } else if (this.state.playAData.round < this.state.playBData.round) {
                                status_A = "Waiting"
                                status_B = "Done"
                            } else if (this.state.playAData.round == this.state.playBData.round) {
                                if (val.data.isFinished) {
                                    if (val.data.win_addr.vec.includes(this.state.playAData.addr)) {
                                        status_A = "Winner"
                                        status_B = "Loser"
                                    } else {
                                        status_A = "Loser"
                                        status_B = "Winner"
                                    }
                                } else if (this.state.playAData.round == 0) {
                                    status_A = "Waiting"
                                    status_B = "Waiting"
                                } else {
                                    status_A = "Draw"
                                    status_B = "Draw"
                                }

                            }

                            this.setState({
                                playerAAddr: val.data.addr[0].substring(0,10) + "..." + val.data.addr[0].substring(val.data.addr[0].length-8),                                
                                playerBAddr: val.data.addr[1].substring(0,10) + "..." + val.data.addr[1].substring(val.data.addr[1].length-8),
                                playerAStatus: status_A,
                                playerBStatus: status_B
                            });

                        }
                        
                        this.setState({
                            gameData: val.data
                        });

                    } 
                })

            }
        )
    }

    get_userInfo = (playAddr, mark) => {
        if (this.state.address != "") {
            let url = node + "accounts/" + playAddr + "/resources"
            axios.get(url).then(
                response => {
                    response.data.map((val, key) => {
                        if (val.type === addr + "::GameIndex::UserInfo") {
                            
                            if (mark == 0) {
                                this.setState({
                                    playAData : val.data
                                });
                            } else if (mark == 1) {
                                this.setState({
                                    playBData : val.data
                                });
                            }

                            console.log("sssssssss=", playAddr, val.data);
                        }
                    })
                }
            )
        }
    }

    func = (props) => {

        
        console.log("props.hash====",props.show)
        let showInfo = "";

        console.log("22222222222athis.state.playAData==", this.state.playAData, this.state.playBData);

        if (this.state.address == "") {
            showInfo = (<h3>Please Connect Wallet at first.</h3>)

        } else if (Object.getOwnPropertyNames(this.state.gameData).length === 0) { //show init button
            if (this.state.address == addr) {
                showInfo = (<button className="css-btn" onClick={this.init_func}>Init</button>)
            } else {
                showInfo = (<h3>No initialized.</h3>)
            }
        } else { //show Join Game button
            if (this.state.gameData.addr.length < 2 ) {
                if (!this.state.gameData.addr.includes(this.state.address)) {
                    showInfo = (<button className="css-btn" onClick={this.game_join}>Join Game</button>)
                }
                
            } else { //play game
                if (!this.state.gameData.isFinished && this.state.gameData.addr.length === 2 && this.state.gameData.addr.includes(this.state.address)) {
                    if ((this.state.playAData.round == this.state.playBData.round )
                        || (this.state.playAData.round > this.state.playBData.round && this.state.address == this.state.playBData.addr)
                        || (this.state.playAData.round < this.state.playBData.round && this.state.address == this.state.playAData.addr)
                    ) {

                        if (this.state.playAData.round == this.state.playBData.round && this.state.playAData.round > 0) {
                            showInfo = (
                                <h3>Please choose a gesture. </h3>
                            )
                        }
                        
                        showInfo = ( 
                            <>
                                <h3>Please choose a gesture. </h3>
                                <a onClick={this.game_start.bind(this, 0)}><img width="15%" src="../0.jpg" /></a>&nbsp;&nbsp;&nbsp;&nbsp;
                                <a onClick={this.game_start.bind(this, 1)}><img width="15%" src="../1.jpg" /></a>&nbsp;&nbsp;&nbsp;&nbsp;
                                <a onClick={this.game_start.bind(this, 2)}><img width="15%" src="../2.jpg" /></a>
                                <br/>
                            </>
                        )
                    }
                } 
            }           
        } 

        return showInfo
    }
    

    render() {
        return (
            <div style={{position:"relative"}}>
                <div style={{position:"absolute", top:"20px", right:"20px"}}>
                    <button className="css-btn" onClick={this.connectWallet}>Connect Wallet</button>
                    <div className="css_addr">
                        {this.state.address == "" ? "" : this.state.address.substring(0,6) + "..." + this.state.address.substring(this.state.address.length-4)}
                    </div>
                </div>
                <br/>
                
                
                <div className="container">
                    <div className="text-center wow fadeInUp" style={{visibility: "visible"}}>
                        <h2 className="title-section marked"> Game Player (Rock-paper-scissors) </h2>
                    </div>
            
                    <div className="row justify-content-center">
                        <div className="col-md-6 col-lg-4 py-3 wow fadeInUp" style={{visibility: "visible"}}>
                            <div className="d-flex flex-row">
                                <div>
                                    <h4><span className="marked">Player A</span> <br />
                                    {this.state.playerAAddr} <br />                                    
                                    {this.state.playerAStatus} 
                                    {this.state.gameData.isFinished || (!this.state.gameData.isFinished && this.state.playAData.round == this.state.playBData.round && this.state.playAData.round > 0) ? <img width="30%" src={"../" + this.state.playAData.opt + ".jpg"} /> : ""}
                                    </h4>
                                </div>
                            </div>
                        </div>
                        
                        <div className="col-md-6 col-lg-5 py-3 wow fadeInUp" style={{visibility: "visible"}}>
                            <div className="d-flex flex-row">
                                <div>
                                    <h4><span className="marked">VS</span></h4>
                                </div>
                            </div>
                        </div>
                
                        <div className="col-md-6 col-lg-4 py-3 wow fadeInUp" style={{visibility: "visible"}}>
                            <div className="d-flex flex-row">
                                <div>
                                    <h4><span  className="marked">Player B</span> <br />
                                    {this.state.playerBAddr} <br />
                                    {this.state.playerBStatus}
                                    {this.state.gameData.isFinished  || (!this.state.gameData.isFinished && this.state.playAData.round == this.state.playBData.round && this.state.playAData.round > 0) ? <img width="30%" src={"../" + this.state.playBData.opt + ".jpg"} /> : ""}
                                    </h4>
                                </div>
                            </div>
                        </div>       
                    
                    </div>
                </div>

                <this.func show={this.state.address} />
                <br/>

            </div>
        )

    }
}


export default EdenGame
