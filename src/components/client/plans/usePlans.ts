
// In the fetchClientPlans function, update the sessions selection to include scheduled_date
const { data: sessionsData, error: sessionsError } = await supabase
  .from("sessions")
  .select(`
    id,
    name,
    order_index,
    scheduled_date
  `)
  .eq("plan_id", plan.id)
  .order("order_index", { ascending: true });

// When mapping sessions, include the scheduledDate
sessions.push({
  id: session.id,
  name: session.name,
  orderIndex: session.order_index,
  scheduledDate: session.scheduled_date,  // Add this line
  series: seriesList
});
