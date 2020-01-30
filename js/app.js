const contractSource = `
contract Hireme = 
 record detail = 
  { finderAddress : address,
    companyName	: string,
    jobRole	  : string,
    jobLink	  : string,
    jobLocation : string,
    picture : string,
    voteCount : int }
    
 record state = { 
    details : map(int, detail),
    detailsNum : int}
  
 entrypoint init() = 
  { details = {},
    detailsNum = 0 }
 
 entrypoint getJob(index : int) : detail = 
  switch(Map.lookup(index, state.details))
   None  => abort("There is no Job with that ID.")
   Some(x) => x

 stateful entrypoint addJob(companyName' : string, jobRole' : string, jobLink' : string, jobLocation' : string,picture' : string) = 
  let detail = { finderAddress  = Call.caller, companyName = companyName', jobRole = jobRole', jobLink = jobLink', picture = picture', jobLocation = jobLocation', voteCount = 0}
  let index = getdetailsNum() + 1
  put(state {details[index] = detail, detailsNum = index})
  
 entrypoint getdetailsNum() : int = 
  state.detailsNum
 payable stateful entrypoint voteJob(index : int) =
  let detail = getJob(index)
  Chain.spend(detail.finderAddress, Call.value)
  let updatedvoteCount = detail.voteCount + Call.value
  let updatedDetails = state.details{ [index].voteCount = updatedvoteCount }
  put(state{ details = updatedDetails })
`;
const contractAddress ='ct_41pSis1ZFvxPWUkw6j6u7AG1k9FaepuaaQwRJKP6S9oXcZxYT';
var client = null;
var jobArray = [];
var jobLength = 0;

//user-defined function
function olu() {
  alert('User Session Started!');
}

function renderJobs() {
    jobArray = jobArray.sort(function(a,b){return b.votes-a.votes})
    var template = $('#template').html();
    Mustache.parse(template);
    var rendered = Mustache.render(template, {jobArray});

    $('#jobBody').html(rendered);
    console.log("Rendered")
  }

   async function callStatic(func, args){
      const contract = await client.getContractInstance(contractSource, {contractAddress});
      const calledGet = await contract.call(func, args, {callStatic: true}).catch(e => console.error(e));
      

      const decodedGet = await calledGet.decode().catch(e => console.error(e));
      return decodedGet;
   }

async function ContractCall(func, args, value){
  const contract = await client.getContractInstance(contractSource, {contractAddress});
  const calledSet = await contract.call(func, args, {amount: value}).catch(e => console.error(e));

  return calledSet;
}

   
  window.addEventListener('load', async () => { 
    $("#loader").show();
  
    client = await Ae.Aepp();
  
    detailsNum = await callStatic ('getdetailsNum',[]);
    for (let i = 1;  i<= detailsNum; i++) {
          const job = await callStatic('getJob',[i]);

          jobArray.push({
            companyName: job.companyName,
            jobRole: job.jobRole,
            jobLink: job.jobLink,
            jobLocation: job.jobLocation,
            picture: job.picture,
            index: i,
            votes: job.voteCount,
          })
      
    }
  
    renderJobs();
  
    $("#loader").hide();
  });
  
jQuery("#jobBody").on("click", ".voteBtn", async function(event){
  $("#loader").show();

    const value = $(this).siblings('input').val();
    const dataIndex = event.target.id;

    await contractCall('voteJob', [dataIndex], value);

    const foundIndex = jobArray.findIndex(job => job.index == dataIndex);
    jobArray[foundIndex].votes += parseInt(value, 10);

    renderJobs();
    $("#loader").hide();
  });
  
  $('#registerBtn').click(async function(){
    $("#loader").show();

    const company = ($('#companyUrl').val()),
        role = ($('#roleUrl').val()),
        picture = ($('#pictureUrl').val()),
        job = ($('#jobUrl').val()),
        location = ($('#loactionUrl').val());

    await contractCall('addJob', [company, role, picture, job, location], 0);
  
    jobArray.push({
      companyName: company,
      jobRole: role,
      jobLink: job,
      jobLocation: location,
      picture: picture,
      index: jobArray.length+1,
      votes: 0
    })
  
    renderJobs();
    $("#loader").hide();
  });