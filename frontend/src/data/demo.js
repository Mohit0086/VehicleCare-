export const demoVehicles = [
 {id:'preview-car-1',reg_no:'RJ14AB1234',brand:'Hyundai',model:'Creta',year:2022,fuel_type:'PETROL',current_km:18500,insurance_expiry:'2026-12-26',puc_expiry:'2026-11-16',overall_status:'DUE_SOON'},
 {id:'preview-car-2',reg_no:'MH12CD5678',brand:'Tata',model:'Nexon EV',year:2024,fuel_type:'ELECTRIC',current_km:8200,insurance_expiry:'2027-05-12',puc_expiry:'2027-02-01',overall_status:'OK'},
];
export const demoMaintenance=[
 {id:1,name:'Engine Oil',last_done_km:10000,last_done_date:'2026-06-20',next_due_km:20000,remaining_km:1500,status:'DUE_SOON'},
 {id:2,name:'Brakes',last_done_km:10000,last_done_date:'2026-06-20',next_due_km:25000,remaining_km:6500,status:'OK'},
 {id:3,name:'Tyres',last_done_km:0,last_done_date:'2025-04-20',next_due_km:40000,remaining_km:21500,status:'OK'},
 {id:4,name:'Battery',last_done_km:0,last_done_date:'2025-04-20',next_due_km:50000,remaining_km:31500,status:'OK'},
 {id:5,name:'Air Filter',last_done_km:10000,last_done_date:'2026-06-20',next_due_km:15000,remaining_km:-3500,status:'DUE'},
 {id:6,name:'Coolant',last_done_km:0,last_done_date:'2025-04-20',next_due_km:30000,remaining_km:11500,status:'OK'},
 {id:7,name:'Air Conditioner',last_done_km:0,last_done_date:'2025-04-20',next_due_km:20000,remaining_km:1500,status:'DUE_SOON'},
 {id:8,name:'General Service',last_done_km:10000,last_done_date:'2026-06-20',next_due_km:20000,remaining_km:1500,status:'DUE_SOON'},
];
export const demoBookings=[
 {id:204,status:'PENDING',booking_date:'2026-11-03',time_slot:'10:00-12:00',reg_no:'RJ14AB1234',center_name:'QuickFix Auto Care',components:['Air Filter','Engine Oil']},
 {id:203,status:'ACCEPTED',booking_date:'2026-10-29',time_slot:'14:00-16:00',reg_no:'RJ14AB1234',center_name:'QuickFix Auto Care',components:['Brakes']},
 {id:199,status:'COMPLETED',booking_date:'2026-09-21',time_slot:'09:00-11:00',reg_no:'MH12CD5678',center_name:'Metro Motors',components:['General Service']},
];
export const demoJobs=[
 {id:204,status:'PENDING',booking_date:'2026-11-03',time_slot:'10:00-12:00',reg_no:'RJ14AB1234',brand:'Hyundai',model:'Creta',owner_name:'Aarav Sharma',components:['Air Filter','Engine Oil'],owner_notes:'Please check a light rattle on cold start.'},
 {id:203,status:'ACCEPTED',booking_date:'2026-10-29',time_slot:'14:00-16:00',reg_no:'MH12CD5678',brand:'Tata',model:'Nexon EV',owner_name:'Aarav Sharma',components:['Brakes'],owner_notes:'Inspect front brake noise.'},
];
export const demoInvoices=[{id:81,bill_no:'VC-2026-0081',generated_at:'2026-09-21',reg_no:'MH12CD5678',center_name:'Metro Motors',total_amount:12450}];
export const demoReminders=[{id:1,status:'UNREAD',message:'Air filter maintenance is due for RJ14AB1234.',reminder_type:'MAINTENANCE_DUE',created_at:'2026-10-26',vehicle_id:'preview-car-1'},{id:2,status:'UNREAD',message:'PUC certificate expires in 20 days for RJ14AB1234.',reminder_type:'PUC_EXPIRY',created_at:'2026-10-26',vehicle_id:'preview-car-1'},{id:3,status:'READ',message:'Engine oil service is due soon for RJ14AB1234.',reminder_type:'MAINTENANCE_DUE_SOON',created_at:'2026-10-20',vehicle_id:'preview-car-1'}];
export const demoAdmin={users:18,vehicles:42,bookings:126,completed:91,pending:14,revenue_month:286500,revenue_total:1742500,monthly_bookings:[{month:'May',bookings:14},{month:'Jun',bookings:19},{month:'Jul',bookings:22},{month:'Aug',bookings:18},{month:'Sep',bookings:27},{month:'Oct',bookings:26}],monthly_revenue:[{month:'May',revenue:172000},{month:'Jun',revenue:218500},{month:'Jul',revenue:246000},{month:'Aug',revenue:204500},{month:'Sep',revenue:311000},{month:'Oct',revenue:286500}],booking_status:[{name:'Completed',value:91},{name:'Pending',value:14},{name:'In progress',value:21}],top_models:[{model:'Hyundai Creta',count:18},{model:'Maruti Swift',count:15},{model:'Tata Nexon',count:12},{model:'Honda City',count:9},{model:'Kia Seltos',count:8}]};
export const demoUsers=[{id:1,name:'Aarav Sharma',email:'aarav@example.com',role:'OWNER',status:'ACTIVE',is_active:true},{id:2,name:'QuickFix Workshop',email:'quickfix@example.com',role:'MECHANIC',status:'ACTIVE',is_active:true},{id:3,name:'Mira Kapoor',email:'mira@example.com',role:'OWNER',status:'ACTIVE',is_active:true}];
export const demoCenters=[{id:1,name:'QuickFix Auto Care',city:'Jaipur',address:'Plot 42, Industrial Area',status:'APPROVED',is_active:true},{id:2,name:'Metro Motors',city:'Pune',address:'18 Baner Road',status:'APPROVED',is_active:true}];
export const demoIntervals=demoMaintenance.map(({id,name})=>({id,name,interval_km:[10000,15000,40000,50000,15000,30000,20000,10000][id-1],interval_months:[6,12,36,24,12,24,12,12][id-1]}));
