const contractSource = `
contract Hireme =
  record detail ={
    id:int,
    name:string,
    description:string,
    createdAt:int,
    updatedAt:int,
    jobdate:int,
    created_by:address,
    jobsalary:int}

  record state ={
    index_counter:int,
    details:map(int,detail)}
      
  entrypoint init()={
    index_counter=0,
    details={}}
    
  entrypoint getjobLength():int=
    state.index_counter

  entrypoint get_job_by_index(index:int) : detail = 
    switch(Map.lookup(index, state.details))
      None => abort("Jobs does not exist with this index")
      Some(x) => x  

  stateful entrypoint add_job(_name:string,_description:string,jobdate:int, jobsalary:int) =
   let stored_job = {id=getjobLength() + 1,name=_name,description=_description, createdAt=Chain.timestamp,updatedAt=Chain.timestamp,created_by = Call.caller,jobdate=jobdate, jobsalary=jobsalary}
   let index = getjobLength() + 1
   put(state{details[index]=stored_job,index_counter=index})
`

const contractAddress ='ct_Z33yy25drGF1fAomz9MjBygLMcewKqd45TWuX2e734KzA21JN'

var client = null // client defuault null
var jobList = [] // empty arr
var jobListLength = 0 // empty product list lenghth

// asychronus read from the blockchain
async function callStatic(func, args) {
    const contract = await client.getContractInstance(contractSource, {contractAddress});
      const calledGet = await contract.call(func, args, {callStatic: true}).catch(e => console.error(e));
      const decodedGet = await calledGet.decode().catch(e => console.error(e));
      return decodedGet;
}
    
//Create a asynchronous write call for our smart contract
async function contractCall(func, args, value) {
    const contract = await client.getContractInstance(contractSource, {contractAddress});
    console.log("Contract:", contract)
    const calledSet = await contract.call(func, args, {amount:value}).catch(e => console.error(e));
    console.log("CalledSet", calledSet)
    return calledSet;
}

//mustache

function renderjobList(){
    let template = $('#template').html();
    Mustache.parse(template);
    var rendered = Mustache.render(template, {jobList});
    $("#jobBody").html(rendered);
    console.log("start rendering.......")
}

window.addEventListener('load', async() => {
    $("#loader").show();
    console.log("Loading...")
    console.log("Loading........")
    console.log("Loading.............")
    client = await Ae.Aepp();
    jobListLength = await callStatic('getjobLength',[]);
    //display the events on the console
    console.log('List Of Jobs On the BlockChain:', jobListLength);
    for(let i = 1; i < jobListLength + 1; i++){
      const getjobList = await callStatic('get_job_by_index', [i]);
      jobList.push({
        index_counter:i,
        id:getjobList.id,
        name:getjobList.name,
        description:getjobList.description,
        createdAt:new Date(getjobList.createdAt),
        updatedAt:new Date(getjobList.updatedAt),
        created_by:getjobList.created_by,
        jobdate:new Date(getjobList.jobdate),
        jobsalary:getjobList.jobsalary
      })
    }
    renderjobList();  
    $("#loader").hide();
  });

//click the Create Button
$("#addBtn").click(async function(){
  $("#loader").show();
  
    var name = ($("#name").val());
    var description = ($("#description").val());
    var jobdate =($("#jobdate").val()) ;
    var jobsalary = ($("#jobsalary").val());
    var jdate = new Date(jobdate).getTime()
    
   await contractCall('add_job', [name, description, jdate, jobsalary],0);

    const all  = await callStatic('getjobLength', [])
    // Push to array

    const newJob  = await callStatic('get_job_by_index', [all])
    jobList.push({
      index_counter:all,
      id:newJob.id,
      name:newJob.name,
      description:newJob.description,
      createdAt:new Date(newJob.createdAt),
      updatedAt:new Date(newJob.updatedAt),
      created_by:newJob.created_by,
      jobdate:new Date(newJob.jobdate),
      jobsalary:newJob.jobsalary
    })

    

    renderjobList(); 

    // clear
    $("#name").val("");
    $("#description").val("");
    $("#jobdate").val("");
    $("#jobsalary").val("");
    $("#loader").hide();
})
