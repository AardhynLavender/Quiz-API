import chai from "chai";
import chaiHttp from "chai-http";
import server from "../app";

chai.use(chaiHttp);
const Actor = chai.request.agent(server);

export default Actor;
