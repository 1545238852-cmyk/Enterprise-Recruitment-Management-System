from fastapi.testclient import TestClient

from app.main import app


def test_retrieval_eval_endpoint_returns_metrics_for_created_job():
    with TestClient(app) as client:
        job_resp = client.post(
            '/api/jobs',
            json={
                'title': 'AI Recruiting Backend Engineer',
                'description': 'Build an AI recruiting backend. Requires 3+ years of Python, FastAPI, RAG, and Agent experience.',
            },
        )
        assert job_resp.status_code == 200
        job_id = job_resp.json()['id']

        good_candidate_resp = client.post(
            '/api/candidates/text',
            json={
                'resume_text': 'Alice\n5 years experience\nSkilled in Python, FastAPI, RAG, Agent\nBuilt enterprise recruiting and knowledge base systems.',
                'source_filename': 'alice.txt',
            },
        )
        assert good_candidate_resp.status_code == 200
        good_candidate_id = good_candidate_resp.json()['id']

        weak_candidate_resp = client.post(
            '/api/candidates/text',
            json={
                'resume_text': 'Bob\n1 year experience\nSkilled in Excel, operations, reporting\nWorked on basic sales support tasks.',
                'source_filename': 'bob.txt',
            },
        )
        assert weak_candidate_resp.status_code == 200
        weak_candidate_id = weak_candidate_resp.json()['id']

        eval_resp = client.get('/api/evals/retrieval')
        assert eval_resp.status_code == 200

        payload = eval_resp.json()
        assert payload['dataset_type'] == 'heuristic_self_labeled_benchmark'
        assert payload['summary']['recall_at_1'] >= 0
        assert payload['summary']['recall_at_3'] >= 0
        assert payload['summary']['recall_at_5'] >= 0
        assert payload['summary']['precision_at_3'] >= 0
        assert payload['summary']['mrr'] >= 0

        target_case = next(case for case in payload['cases'] if case['job_id'] == job_id)
        assert good_candidate_id in target_case['relevant_candidate_ids']
        assert weak_candidate_id not in target_case['relevant_candidate_ids']
        assert good_candidate_id in target_case['ranked_candidate_ids']
